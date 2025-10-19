/**
 * Distributed Memory Manager
 * 
 * This module orchestrates MongoDB, Redis, and WebSocket to provide
 * distributed memory and real-time sync for AI collaboration modes.
 */

import log from "electron-log";
import { mongoDBClient, MongoDBConfig } from "./mongodb_client";
import { redisEventBus, RedisConfig, DistributedEvent } from "./redis_event_bus";
import { WebSocketSyncServer, WSMessage } from "./websocket_sync";
import type {
  ModeStateDocument,
  DistributedContextDocument,
} from "./mongodb_schema";

const logger = log.scope("distributed_memory");

export interface DistributedMemoryConfig {
  mongodb?: MongoDBConfig;
  redis?: RedisConfig;
  websocket?: {
    port: number;
  };
  userId: string;
  enableMongoDB?: boolean;
  enableRedis?: boolean;
  enableWebSocket?: boolean;
}

export interface DistributedMemoryStatus {
  mongodb: {
    enabled: boolean;
    connected: boolean;
    healthy: boolean;
  };
  redis: {
    enabled: boolean;
    connected: boolean;
    healthy: boolean;
  };
  websocket: {
    enabled: boolean;
    running: boolean;
    clientCount: number;
  };
  instanceId: string;
  isFullyOperational: boolean;
}

/**
 * Distributed Memory Manager
 * 
 * Coordinates MongoDB (persistent storage), Redis (event bus), and
 * WebSocket (live sync) for distributed AI collaboration.
 */
class DistributedMemoryManager {
  private static _instance: DistributedMemoryManager;
  private wsServer: WebSocketSyncServer | null = null;
  private config: DistributedMemoryConfig | null = null;
  private initialized = false;

  static get instance(): DistributedMemoryManager {
    if (!this._instance) {
      this._instance = new DistributedMemoryManager();
    }
    return this._instance;
  }

  /**
   * Initialize distributed memory systems
   */
  async initialize(config: DistributedMemoryConfig): Promise<void> {
    if (this.initialized) {
      logger.info("Distributed memory already initialized");
      return;
    }

    this.config = config;
    logger.info("Initializing distributed memory systems...");

    // Initialize MongoDB
    if (config.enableMongoDB && config.mongodb) {
      try {
        await mongoDBClient.initialize(config.mongodb);
        logger.info("✓ MongoDB initialized");
      } catch (error) {
        logger.error("MongoDB initialization failed", error);
        if (config.enableMongoDB) {
          throw error; // Fail if MongoDB is required
        }
      }
    }

    // Initialize Redis
    if (config.enableRedis && config.redis) {
      try {
        await redisEventBus.initialize(config.redis);
        this.setupRedisEventHandlers();
        logger.info("✓ Redis initialized");
      } catch (error) {
        logger.error("Redis initialization failed", error);
        if (config.enableRedis) {
          throw error; // Fail if Redis is required
        }
      }
    }

    // Initialize WebSocket
    if (config.enableWebSocket && config.websocket) {
      try {
        this.wsServer = new WebSocketSyncServer();
        await this.wsServer.start(config.websocket.port);
        this.setupWebSocketHandlers();
        logger.info("✓ WebSocket initialized");
      } catch (error) {
        logger.error("WebSocket initialization failed", error);
        if (config.enableWebSocket) {
          throw error; // Fail if WebSocket is required
        }
      }
    }

    this.initialized = true;
    logger.info("Distributed memory systems initialized successfully");
  }

  /**
   * Setup Redis event handlers
   */
  private setupRedisEventHandlers(): void {
    // Handle mode changes from other instances
    redisEventBus.on("mode:changed", async (event: DistributedEvent) => {
      logger.info("Received mode change event from another instance", {
        from: event.instanceId,
        mode: event.payload,
      });

      // Optionally sync to MongoDB
      if (mongoDBClient.isConnected()) {
        await this.syncModeStateToMongoDB(event);
      }

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        this.wsServer.broadcast({
          type: "mode-update",
          userId: event.userId,
          timestamp: Date.now(),
          payload: event.payload,
        });
      }
    });

    // Handle context updates
    redisEventBus.on("context:updated", async (event: DistributedEvent) => {
      logger.info("Received context update event", {
        from: event.instanceId,
      });

      // Sync to MongoDB
      if (mongoDBClient.isConnected()) {
        await this.syncContextToMongoDB(event);
      }

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        this.wsServer.broadcast({
          type: "context-sync",
          userId: event.userId,
          timestamp: Date.now(),
          payload: event.payload,
        });
      }
    });
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;

    // Handle state requests
    this.wsServer.on("state-request", async (message: WSMessage) => {
      logger.info("Received state request", { from: message.instanceId });

      // Fetch state from MongoDB if available
      if (mongoDBClient.isConnected()) {
        const state = await this.getDistributedState(message.userId);
        
        // Send response back via WebSocket
        this.wsServer!.broadcastToUser(message.userId, {
          type: "state-response",
          userId: message.userId,
          timestamp: Date.now(),
          payload: state,
        });
      }
    });
  }

  /**
   * Sync mode state to MongoDB
   */
  private async syncModeStateToMongoDB(
    event: DistributedEvent,
  ): Promise<void> {
    try {
      const collection = mongoDBClient.getModeStateCollection();
      const payload = event.payload as any;

      await collection.updateOne(
        { userId: event.userId, instanceId: event.instanceId },
        {
          $set: {
            currentMode: payload.toMode,
            previousMode: payload.fromMode,
            updatedAt: new Date(),
            syncVersion: { $inc: 1 },
          },
        },
        { upsert: true },
      );

      logger.debug("Synced mode state to MongoDB");
    } catch (error) {
      logger.error("Failed to sync mode state to MongoDB", error);
    }
  }

  /**
   * Sync context to MongoDB
   */
  private async syncContextToMongoDB(event: DistributedEvent): Promise<void> {
    try {
      const collection = mongoDBClient.getDistributedContextCollection();
      const payload = event.payload as any;

      await collection.updateOne(
        { userId: event.userId, contextKey: payload.contextKey },
        {
          $set: {
            data: payload.data,
            updatedAt: new Date(),
            "metadata.version": payload.version,
            "metadata.lastModifiedBy": event.instanceId,
          },
        },
        { upsert: true },
      );

      logger.debug("Synced context to MongoDB");
    } catch (error) {
      logger.error("Failed to sync context to MongoDB", error);
    }
  }

  /**
   * Get distributed state from MongoDB
   */
  private async getDistributedState(userId: string): Promise<{
    modeState: ModeStateDocument | null;
    contexts: DistributedContextDocument[];
  }> {
    try {
      const modeStateCol = mongoDBClient.getModeStateCollection();
      const contextCol = mongoDBClient.getDistributedContextCollection();

      // Get latest mode state
      const modeStates = await modeStateCol
        .find({ userId })
        .sort({ updatedAt: -1 })
        .limit(1)
        .toArray();

      const modeState = modeStates[0] || null;

      // Get active contexts
      const contexts = await contextCol
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

      return { modeState, contexts };
    } catch (error) {
      logger.error("Failed to get distributed state", error);
      return { modeState: null, contexts: [] };
    }
  }

  /**
   * Publish mode change to distributed system
   */
  async publishModeChange(
    userId: string,
    fromMode: "inspired" | "didactic" | "parallel" | null,
    toMode: "inspired" | "didactic" | "parallel",
    configuration?: Record<string, unknown>,
  ): Promise<void> {
    // Publish to Redis event bus
    if (redisEventBus.isConnected()) {
      await redisEventBus.publishModeChanged(userId, {
        fromMode,
        toMode,
        configuration,
      });
    }

    // Store in MongoDB
    if (mongoDBClient.isConnected()) {
      const collection = mongoDBClient.getModeTransitionsCollection();
      await collection.insertOne({
        userId,
        instanceId: redisEventBus.getInstanceId(),
        fromMode,
        toMode,
        contextSnapshot: null,
        transitionDuration: 0,
        success: true,
        errorMessage: null,
        timestamp: new Date(),
        syncedAt: new Date(),
      });
    }

    // Broadcast via WebSocket
    if (this.wsServer) {
      this.wsServer.broadcast({
        type: "mode-update",
        userId,
        timestamp: Date.now(),
        payload: { fromMode, toMode, configuration },
      });
    }

    logger.info("Published mode change to distributed system", {
      fromMode,
      toMode,
    });
  }

  /**
   * Publish context update to distributed system
   */
  async publishContextUpdate(
    userId: string,
    contextKey: string,
    contextType: "chat" | "project" | "mode" | "custom",
    data: Record<string, unknown>,
  ): Promise<void> {
    // Publish to Redis
    if (redisEventBus.isConnected()) {
      await redisEventBus.publishContextUpdated(userId, {
        contextKey,
        contextType,
        data,
        version: Date.now(), // Simple versioning
      });
    }

    // Store in MongoDB
    if (mongoDBClient.isConnected()) {
      const collection = mongoDBClient.getDistributedContextCollection();
      await collection.updateOne(
        { userId, contextKey },
        {
          $set: {
            contextType,
            data,
            updatedAt: new Date(),
            "metadata.lastModifiedBy": redisEventBus.getInstanceId(),
            "metadata.version": Date.now(),
          },
          $setOnInsert: {
            "metadata.createdBy": redisEventBus.getInstanceId(),
            "metadata.tags": [],
            createdAt: new Date(),
            expiresAt: null,
          },
        },
        { upsert: true },
      );
    }

    logger.info("Published context update to distributed system", {
      contextKey,
    });
  }

  /**
   * Store AI response source for glass-box transparency
   */
  async storeResponseSource(
    userId: string,
    chatId: number,
    messageId: number,
    mode: "inspired" | "didactic" | "parallel",
    source: {
      sourceType: "local" | "external" | "harmonized";
      provider: string;
      model: string;
      confidence?: number;
      metadata?: Record<string, unknown>;
    },
    responseHash: string,
  ): Promise<void> {
    if (!mongoDBClient.isConnected()) return;

    try {
      const collection = mongoDBClient.getAIResponseSourcesCollection();
      await collection.insertOne({
        userId,
        instanceId: redisEventBus.getInstanceId(),
        chatId,
        messageId,
        mode,
        sourceType: source.sourceType,
        provider: source.provider,
        model: source.model,
        confidence: source.confidence || null,
        responseHash,
        metadata: source.metadata || {},
        timestamp: new Date(),
      });

      logger.debug("Stored response source in distributed memory", {
        chatId,
        messageId,
        provider: source.provider,
      });
    } catch (error) {
      logger.error("Failed to store response source", error);
    }
  }

  /**
   * Get status of all distributed systems
   */
  async getStatus(): Promise<DistributedMemoryStatus> {
    const mongoHealth = mongoDBClient.isConnected()
      ? await mongoDBClient.healthCheck()
      : false;
    const redisHealth = redisEventBus.isConnected()
      ? await redisEventBus.healthCheck()
      : false;

    const status: DistributedMemoryStatus = {
      mongodb: {
        enabled: this.config?.enableMongoDB ?? false,
        connected: mongoDBClient.isConnected(),
        healthy: mongoHealth,
      },
      redis: {
        enabled: this.config?.enableRedis ?? false,
        connected: redisEventBus.isConnected(),
        healthy: redisHealth,
      },
      websocket: {
        enabled: this.config?.enableWebSocket ?? false,
        running: this.wsServer !== null,
        clientCount: this.wsServer?.getClientCount() ?? 0,
      },
      instanceId: redisEventBus.getInstanceId(),
      isFullyOperational:
        (!this.config?.enableMongoDB || (mongoDBClient.isConnected() && mongoHealth)) &&
        (!this.config?.enableRedis || (redisEventBus.isConnected() && redisHealth)) &&
        (!this.config?.enableWebSocket || this.wsServer !== null),
    };

    return status;
  }

  /**
   * Shutdown all distributed systems
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down distributed memory systems...");

    if (this.wsServer) {
      await this.wsServer.stop();
      this.wsServer = null;
    }

    if (redisEventBus.isConnected()) {
      await redisEventBus.close();
    }

    if (mongoDBClient.isConnected()) {
      await mongoDBClient.close();
    }

    this.initialized = false;
    logger.info("Distributed memory systems shut down");
  }
}

export const distributedMemoryManager = DistributedMemoryManager.instance;
