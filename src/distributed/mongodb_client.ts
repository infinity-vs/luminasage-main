/**
 * MongoDB Client for Distributed Memory
 * 
 * This module manages MongoDB connections and provides
 * type-safe collection access for distributed mode state.
 */

import log from "electron-log";
import { MongoClient, Db, Collection } from "mongodb";
import type {
  ModeStateDocument,
  ModeTransitionDocument,
  DistributedContextDocument,
  AIResponseSourceDocument,
  SyncEventDocument,
} from "./mongodb_schema";
import { MONGO_COLLECTIONS, MONGO_INDEXES } from "./mongodb_schema";

const logger = log.scope("mongodb_client");

export interface MongoDBConfig {
  url: string;
  database: string;
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    connectTimeoutMS?: number;
    socketTimeoutMS?: number;
  };
}

/**
 * MongoDB Client Manager
 */
class MongoDBClient {
  private static _instance: MongoDBClient;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoDBConfig | null = null;
  private isConnecting = false;

  static get instance(): MongoDBClient {
    if (!this._instance) {
      this._instance = new MongoDBClient();
    }
    return this._instance;
  }

  /**
   * Initialize MongoDB connection
   */
  async initialize(config: MongoDBConfig): Promise<void> {
    if (this.client && this.db) {
      logger.info("MongoDB already connected");
      return;
    }

    if (this.isConnecting) {
      logger.info("MongoDB connection already in progress");
      return;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      logger.info("Connecting to MongoDB...", {
        url: config.url.replace(/\/\/.*@/, "//*****@"), // Hide credentials
        database: config.database,
      });

      this.client = new MongoClient(config.url, {
        maxPoolSize: config.options?.maxPoolSize ?? 10,
        minPoolSize: config.options?.minPoolSize ?? 2,
        connectTimeoutMS: config.options?.connectTimeoutMS ?? 10000,
        socketTimeoutMS: config.options?.socketTimeoutMS ?? 45000,
      });

      await this.client.connect();
      this.db = this.client.db(config.database);

      // Ensure indexes exist
      await this.ensureIndexes();

      logger.info("MongoDB connected successfully");
    } catch (error) {
      logger.error("Failed to connect to MongoDB", error);
      this.client = null;
      this.db = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Ensure all indexes are created
   */
  private async ensureIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Mode State indexes
      const modeStateCol = this.db.collection(MONGO_COLLECTIONS.MODE_STATE);
      for (const index of MONGO_INDEXES.MODE_STATE) {
        await modeStateCol.createIndex(index.key, {
          unique: (index as any).unique,
        });
      }

      // Mode Transitions indexes
      const transitionsCol = this.db.collection(
        MONGO_COLLECTIONS.MODE_TRANSITIONS,
      );
      for (const index of MONGO_INDEXES.MODE_TRANSITIONS) {
        await transitionsCol.createIndex(index.key);
      }

      // Distributed Context indexes
      const contextCol = this.db.collection(
        MONGO_COLLECTIONS.DISTRIBUTED_CONTEXT,
      );
      for (const index of MONGO_INDEXES.DISTRIBUTED_CONTEXT) {
        await contextCol.createIndex(index.key, {
          unique: (index as any).unique,
          expireAfterSeconds: (index as any).expireAfterSeconds,
        });
      }

      // AI Response Sources indexes
      const sourcesCol = this.db.collection(
        MONGO_COLLECTIONS.AI_RESPONSE_SOURCES,
      );
      for (const index of MONGO_INDEXES.AI_RESPONSE_SOURCES) {
        await sourcesCol.createIndex(index.key, {
          unique: (index as any).unique,
        });
      }

      // Sync Events indexes
      const eventsCol = this.db.collection(MONGO_COLLECTIONS.SYNC_EVENTS);
      for (const index of MONGO_INDEXES.SYNC_EVENTS) {
        await eventsCol.createIndex(index.key, {
          expireAfterSeconds: (index as any).expireAfterSeconds,
        });
      }

      logger.info("MongoDB indexes ensured");
    } catch (error) {
      logger.error("Failed to create MongoDB indexes", error);
      throw error;
    }
  }

  /**
   * Check if MongoDB is connected
   */
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  /**
   * Get Mode State collection
   */
  getModeStateCollection(): Collection<ModeStateDocument> {
    if (!this.db) {
      throw new Error("MongoDB not initialized");
    }
    return this.db.collection<ModeStateDocument>(MONGO_COLLECTIONS.MODE_STATE);
  }

  /**
   * Get Mode Transitions collection
   */
  getModeTransitionsCollection(): Collection<ModeTransitionDocument> {
    if (!this.db) {
      throw new Error("MongoDB not initialized");
    }
    return this.db.collection<ModeTransitionDocument>(
      MONGO_COLLECTIONS.MODE_TRANSITIONS,
    );
  }

  /**
   * Get Distributed Context collection
   */
  getDistributedContextCollection(): Collection<DistributedContextDocument> {
    if (!this.db) {
      throw new Error("MongoDB not initialized");
    }
    return this.db.collection<DistributedContextDocument>(
      MONGO_COLLECTIONS.DISTRIBUTED_CONTEXT,
    );
  }

  /**
   * Get AI Response Sources collection
   */
  getAIResponseSourcesCollection(): Collection<AIResponseSourceDocument> {
    if (!this.db) {
      throw new Error("MongoDB not initialized");
    }
    return this.db.collection<AIResponseSourceDocument>(
      MONGO_COLLECTIONS.AI_RESPONSE_SOURCES,
    );
  }

  /**
   * Get Sync Events collection
   */
  getSyncEventsCollection(): Collection<SyncEventDocument> {
    if (!this.db) {
      throw new Error("MongoDB not initialized");
    }
    return this.db.collection<SyncEventDocument>(MONGO_COLLECTIONS.SYNC_EVENTS);
  }

  /**
   * Close MongoDB connection
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        logger.info("MongoDB connection closed");
      } catch (error) {
        logger.error("Error closing MongoDB connection", error);
      } finally {
        this.client = null;
        this.db = null;
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error("MongoDB health check failed", error);
      return false;
    }
  }
}

export const mongoDBClient = MongoDBClient.instance;
