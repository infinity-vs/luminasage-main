/**
 * WebSocket Live Sync
 * 
 * This module provides WebSocket-based real-time synchronization
 * for distributed AI collaboration mode state.
 */

import log from "electron-log";
import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const logger = log.scope("websocket_sync");

/**
 * WebSocket message types
 */
export type WSMessageType =
  | "connect"
  | "disconnect"
  | "ping"
  | "pong"
  | "mode-update"
  | "context-sync"
  | "state-request"
  | "state-response"
  | "heartbeat"
  | "error";

/**
 * WebSocket message structure
 */
export interface WSMessage<T = unknown> {
  id: string;
  type: WSMessageType;
  userId: string;
  instanceId: string;
  timestamp: number;
  payload: T;
}

/**
 * Mode update payload
 */
export interface ModeUpdatePayload {
  currentMode: "inspired" | "didactic" | "parallel";
  previousMode: "inspired" | "didactic" | "parallel" | null;
  configuration?: Record<string, unknown>;
}

/**
 * Context sync payload
 */
export interface ContextSyncPayload {
  contextKey: string;
  data: Record<string, unknown>;
  version: number;
  mergeStrategy: "replace" | "merge" | "ignore";
}

/**
 * State request/response payload
 */
export interface StatePayload {
  modeState?: ModeUpdatePayload;
  contexts?: Record<string, ContextSyncPayload>;
  timestamp: number;
}

/**
 * WebSocket client info
 */
interface WSClientInfo {
  ws: WebSocket;
  userId: string;
  instanceId: string;
  connectedAt: number;
  lastPing: number;
}

/**
 * Message handler type
 */
export type WSMessageHandler<T = unknown> = (
  message: WSMessage<T>,
  clientId: string,
) => void | Promise<void>;

/**
 * WebSocket Sync Server
 */
export class WebSocketSyncServer {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, WSClientInfo>();
  private handlers = new Map<WSMessageType, Set<WSMessageHandler>>();
  private pingInterval: NodeJS.Timeout | null = null;
  private instanceId: string;

  constructor() {
    this.instanceId = uuidv4();
  }

  /**
   * Start WebSocket server
   */
  async start(port: number): Promise<void> {
    if (this.wss) {
      logger.info("WebSocket server already running");
      return;
    }

    try {
      this.wss = new WebSocketServer({ port });

      this.wss.on("connection", this.handleConnection.bind(this));

      this.wss.on("error", (error) => {
        logger.error("WebSocket server error", error);
      });

      // Start ping interval
      this.pingInterval = setInterval(() => {
        this.pingClients();
      }, 30000); // Ping every 30 seconds

      logger.info(`WebSocket server started on port ${port}`);
    } catch (error) {
      logger.error("Failed to start WebSocket server", error);
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = uuidv4();

    logger.info("New WebSocket connection", { clientId });

    ws.on("message", (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    ws.on("close", () => {
      this.handleDisconnect(clientId);
    });

    ws.on("error", (error) => {
      logger.error("WebSocket client error", { clientId, error });
    });

    // Send welcome message
    this.send(ws, {
      id: uuidv4(),
      type: "connect",
      userId: "",
      instanceId: this.instanceId,
      timestamp: Date.now(),
      payload: { clientId, instanceId: this.instanceId },
    });
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;

      // Register client if this is first message with userId
      if (!this.clients.has(clientId) && message.userId) {
        const client = this.clients.get(clientId);
        if (client) {
          this.clients.set(clientId, {
            ...client,
            userId: message.userId,
            instanceId: message.instanceId,
          });
        } else {
          const ws = Array.from(this.wss?.clients || []).find(
            (ws) => (ws as any).clientId === clientId,
          );
          if (ws) {
            this.clients.set(clientId, {
              ws,
              userId: message.userId,
              instanceId: message.instanceId,
              connectedAt: Date.now(),
              lastPing: Date.now(),
            });
          }
        }
      }

      // Handle ping/pong
      if (message.type === "ping") {
        const client = this.clients.get(clientId);
        if (client) {
          this.clients.set(clientId, { ...client, lastPing: Date.now() });
          this.send(client.ws, {
            ...message,
            type: "pong",
            instanceId: this.instanceId,
          });
        }
        return;
      }

      // Call registered handlers
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(message, clientId);
          } catch (error) {
            logger.error(`Error in message handler for ${message.type}`, error);
          }
        }
      }
    } catch (error) {
      logger.error("Error handling WebSocket message", error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    logger.info("WebSocket client disconnected", { clientId });
  }

  /**
   * Send ping to all clients
   */
  private pingClients(): void {
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      // Remove stale clients (no ping in 90 seconds)
      if (now - client.lastPing > 90000) {
        client.ws.close();
        this.clients.delete(clientId);
        logger.info("Removed stale client", { clientId });
        continue;
      }

      // Send ping
      this.send(client.ws, {
        id: uuidv4(),
        type: "ping",
        userId: client.userId,
        instanceId: this.instanceId,
        timestamp: now,
        payload: {},
      });
    }
  }

  /**
   * Send message to specific client
   */
  private send(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(
    message: Omit<WSMessage, "id" | "instanceId">,
    excludeClientId?: string,
  ): void {
    const fullMessage: WSMessage = {
      ...message,
      id: uuidv4(),
      instanceId: this.instanceId,
    };

    for (const [clientId, client] of this.clients.entries()) {
      if (clientId !== excludeClientId) {
        this.send(client.ws, fullMessage);
      }
    }
  }

  /**
   * Broadcast to specific user
   */
  broadcastToUser(userId: string, message: Omit<WSMessage, "id" | "instanceId">): void {
    const fullMessage: WSMessage = {
      ...message,
      id: uuidv4(),
      instanceId: this.instanceId,
    };

    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        this.send(client.ws, fullMessage);
      }
    }
  }

  /**
   * Register message handler
   */
  on<T = unknown>(
    messageType: WSMessageType,
    handler: WSMessageHandler<T>,
  ): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set());
    }
    this.handlers.get(messageType)!.add(handler as WSMessageHandler);
  }

  /**
   * Unregister message handler
   */
  off<T = unknown>(
    messageType: WSMessageType,
    handler: WSMessageHandler<T>,
  ): void {
    const handlers = this.handlers.get(messageType);
    if (handlers) {
      handlers.delete(handler as WSMessageHandler);
    }
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients by user
   */
  getClientsByUser(userId: string): number {
    return Array.from(this.clients.values()).filter(
      (c) => c.userId === userId,
    ).length;
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.wss) {
      // Close all client connections
      for (const client of this.clients.values()) {
        client.ws.close();
      }
      this.clients.clear();

      // Close server
      return new Promise((resolve, reject) => {
        this.wss!.close((err) => {
          if (err) {
            logger.error("Error stopping WebSocket server", err);
            reject(err);
          } else {
            logger.info("WebSocket server stopped");
            this.wss = null;
            resolve();
          }
        });
      });
    }
  }
}

/**
 * WebSocket Sync Client
 */
export class WebSocketSyncClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private userId: string;
  private instanceId: string;
  private handlers = new Map<WSMessageType, Set<WSMessageHandler>>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(userId: string) {
    this.userId = userId;
    this.instanceId = uuidv4();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(url: string): Promise<void> {
    if (this.ws) {
      logger.info("WebSocket client already connected");
      return;
    }

    this.url = url;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.on("open", () => {
          logger.info("WebSocket client connected", { url });
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on("message", (data: Buffer) => {
          this.handleMessage(data);
        });

        this.ws.on("close", () => {
          logger.info("WebSocket client disconnected");
          this.handleDisconnect();
        });

        this.ws.on("error", (error) => {
          logger.error("WebSocket client error", error);
          reject(error);
        });
      } catch (error) {
        logger.error("Failed to connect WebSocket client", error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;

      // Handle pong
      if (message.type === "pong") {
        logger.debug("Received pong from server");
        return;
      }

      // Call registered handlers
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(message, "");
          } catch (error) {
            logger.error(`Error in message handler for ${message.type}`, error);
          }
        }
      }
    } catch (error) {
      logger.error("Error handling WebSocket message", error);
    }
  }

  /**
   * Handle disconnect and attempt reconnect
   */
  private handleDisconnect(): void {
    this.ws = null;

    if (
      this.url &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      logger.info(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect(this.url!).catch((error) => {
          logger.error("Reconnect failed", error);
        });
      }, delay);
    }
  }

  /**
   * Send message to server
   */
  send(message: Omit<WSMessage, "id" | "userId" | "instanceId">): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const fullMessage: WSMessage = {
      ...message,
      id: uuidv4(),
      userId: this.userId,
      instanceId: this.instanceId,
    };

    this.ws.send(JSON.stringify(fullMessage));
  }

  /**
   * Register message handler
   */
  on<T = unknown>(
    messageType: WSMessageType,
    handler: WSMessageHandler<T>,
  ): void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set());
    }
    this.handlers.get(messageType)!.add(handler as WSMessageHandler);
  }

  /**
   * Unregister message handler
   */
  off<T = unknown>(
    messageType: WSMessageType,
    handler: WSMessageHandler<T>,
  ): void {
    const handlers = this.handlers.get(messageType);
    if (handlers) {
      handlers.delete(handler as WSMessageHandler);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
