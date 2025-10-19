/**
 * Redis Event Bus for Distributed Memory
 * 
 * This module provides a pub/sub event bus using Redis for
 * real-time synchronization across Dyad instances.
 */

import log from "electron-log";
import { createClient, RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";

const logger = log.scope("redis_event_bus");

export interface RedisConfig {
  url: string;
  options?: {
    socket?: {
      connectTimeout?: number;
      reconnectStrategy?: (retries: number) => number | Error;
    };
  };
}

/**
 * Event types for the distributed system
 */
export type DistributedEventType =
  | "mode:changed"
  | "mode:config-updated"
  | "context:created"
  | "context:updated"
  | "context:deleted"
  | "response:generated"
  | "mcp:tool-executed"
  | "mcp:server-added"
  | "mcp:server-removed"
  | "sync:request"
  | "sync:heartbeat";

/**
 * Event payload structure
 */
export interface DistributedEvent<T = unknown> {
  eventId: string;
  eventType: DistributedEventType;
  userId: string;
  instanceId: string;
  timestamp: number;
  payload: T;
  metadata?: Record<string, unknown>;
}

/**
 * Mode change event payload
 */
export interface ModeChangedPayload {
  fromMode: "inspired" | "didactic" | "parallel" | null;
  toMode: "inspired" | "didactic" | "parallel";
  configuration?: Record<string, unknown>;
}

/**
 * Context update event payload
 */
export interface ContextUpdatedPayload {
  contextKey: string;
  contextType: "chat" | "project" | "mode" | "custom";
  data: Record<string, unknown>;
  version: number;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (
  event: DistributedEvent<T>,
) => void | Promise<void>;

/**
 * Redis Event Bus
 */
class RedisEventBus {
  private static _instance: RedisEventBus;
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private config: RedisConfig | null = null;
  private isConnecting = false;
  private handlers = new Map<DistributedEventType, Set<EventHandler>>();
  private instanceId: string;

  constructor() {
    this.instanceId = uuidv4();
  }

  static get instance(): RedisEventBus {
    if (!this._instance) {
      this._instance = new RedisEventBus();
    }
    return this._instance;
  }

  /**
   * Get the instance ID for this Dyad instance
   */
  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Initialize Redis connections
   */
  async initialize(config: RedisConfig): Promise<void> {
    if (this.publisher && this.subscriber) {
      logger.info("Redis already connected");
      return;
    }

    if (this.isConnecting) {
      logger.info("Redis connection already in progress");
      return;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      logger.info("Connecting to Redis...", {
        url: config.url.replace(/\/\/.*@/, "//*****@"), // Hide credentials
      });

      // Create publisher client
      this.publisher = createClient({
        url: config.url,
        socket: config.options?.socket,
      });

      this.publisher.on("error", (err) => {
        logger.error("Redis Publisher Error:", err);
      });

      await this.publisher.connect();

      // Create subscriber client
      this.subscriber = createClient({
        url: config.url,
        socket: config.options?.socket,
      });

      this.subscriber.on("error", (err) => {
        logger.error("Redis Subscriber Error:", err);
      });

      await this.subscriber.connect();

      // Subscribe to all event channels
      await this.setupSubscriptions();

      logger.info("Redis connected successfully", {
        instanceId: this.instanceId,
      });
    } catch (error) {
      logger.error("Failed to connect to Redis", error);
      this.publisher = null;
      this.subscriber = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Setup Redis subscriptions
   */
  private async setupSubscriptions(): Promise<void> {
    if (!this.subscriber) return;

    // Subscribe to pattern for all dyad events
    await this.subscriber.pSubscribe(
      "dyad:event:*",
      this.handleRedisMessage.bind(this),
    );

    logger.info("Redis subscriptions setup");
  }

  /**
   * Handle incoming Redis messages
   */
  private async handleRedisMessage(
    message: string,
    _channel: string,
  ): Promise<void> {
    try {
      const event = JSON.parse(message) as DistributedEvent;

      // Ignore events from this instance
      if (event.instanceId === this.instanceId) {
        return;
      }

      logger.debug("Received event", {
        type: event.eventType,
        from: event.instanceId,
      });

      // Call registered handlers
      const handlers = this.handlers.get(event.eventType);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            logger.error(
              `Error in event handler for ${event.eventType}`,
              error,
            );
          }
        }
      }
    } catch (error) {
      logger.error("Error handling Redis message", error);
    }
  }

  /**
   * Publish an event
   */
  async publish<T = unknown>(
    eventType: DistributedEventType,
    userId: string,
    payload: T,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.publisher) {
      throw new Error("Redis not initialized");
    }

    const event: DistributedEvent<T> = {
      eventId: uuidv4(),
      eventType,
      userId,
      instanceId: this.instanceId,
      timestamp: Date.now(),
      payload,
      metadata,
    };

    const channel = `dyad:event:${eventType}`;
    const message = JSON.stringify(event);

    try {
      await this.publisher.publish(channel, message);
      logger.debug("Published event", { type: eventType, to: channel });
    } catch (error) {
      logger.error("Failed to publish event", error);
      throw error;
    }
  }

  /**
   * Subscribe to an event type
   */
  on<T = unknown>(
    eventType: DistributedEventType,
    handler: EventHandler<T>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    logger.debug("Added event handler", { type: eventType });
  }

  /**
   * Unsubscribe from an event type
   */
  off<T = unknown>(
    eventType: DistributedEventType,
    handler: EventHandler<T>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      logger.debug("Removed event handler", { type: eventType });
    }
  }

  /**
   * Publish mode change event
   */
  async publishModeChanged(
    userId: string,
    payload: ModeChangedPayload,
  ): Promise<void> {
    await this.publish("mode:changed", userId, payload);
  }

  /**
   * Publish context update event
   */
  async publishContextUpdated(
    userId: string,
    payload: ContextUpdatedPayload,
  ): Promise<void> {
    await this.publish("context:updated", userId, payload);
  }

  /**
   * Publish heartbeat
   */
  async publishHeartbeat(userId: string): Promise<void> {
    await this.publish("sync:heartbeat", userId, {
      instanceId: this.instanceId,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return (
      this.publisher !== null &&
      this.subscriber !== null &&
      this.publisher.isOpen &&
      this.subscriber.isOpen
    );
  }

  /**
   * Close Redis connections
   */
  async close(): Promise<void> {
    try {
      if (this.subscriber) {
        await this.subscriber.pUnsubscribe("dyad:event:*");
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }
      logger.info("Redis connections closed");
    } catch (error) {
      logger.error("Error closing Redis connections", error);
    } finally {
      this.publisher = null;
      this.subscriber = null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.publisher) return false;

    try {
      await this.publisher.ping();
      return true;
    } catch (error) {
      logger.error("Redis health check failed", error);
      return false;
    }
  }
}

export const redisEventBus = RedisEventBus.instance;
