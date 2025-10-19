/**
 * MongoDB Schema for Distributed Memory
 * 
 * This module defines MongoDB collections and schemas for distributed
 * AI collaboration context and state management.
 */

/**
 * Mode State Collection
 * Stores the current state of AI collaboration modes across instances
 */
export interface ModeStateDocument {
  _id?: string;
  userId: string; // Unique identifier for the user/session
  instanceId: string; // Unique identifier for this Dyad instance
  currentMode: "inspired" | "didactic" | "parallel";
  previousMode: "inspired" | "didactic" | "parallel" | null;
  capabilities: {
    localAI: boolean;
    externalAI: boolean;
    multiChannel: boolean;
    offlineCapable: boolean;
    realTimeSync: boolean;
  };
  configuration: Record<string, unknown> | null;
  activatedAt: Date;
  updatedAt: Date;
  syncVersion: number; // For optimistic locking
}

/**
 * Mode Transition Collection
 * Stores history of mode transitions for analytics and sync
 */
export interface ModeTransitionDocument {
  _id?: string;
  userId: string;
  instanceId: string;
  fromMode: "inspired" | "didactic" | "parallel" | null;
  toMode: "inspired" | "didactic" | "parallel";
  contextSnapshot: Record<string, unknown> | null;
  transitionDuration: number;
  success: boolean;
  errorMessage: string | null;
  timestamp: Date;
  syncedAt: Date | null;
}

/**
 * Distributed Context Collection
 * Stores shared context across AI collaboration sessions
 */
export interface DistributedContextDocument {
  _id?: string;
  userId: string;
  contextKey: string; // Unique key for this context (e.g., "project:app123")
  contextType: "chat" | "project" | "mode" | "custom";
  mode: "inspired" | "didactic" | "parallel";
  data: Record<string, unknown>;
  metadata: {
    createdBy: string; // instanceId
    lastModifiedBy: string; // instanceId
    version: number;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null; // Optional TTL
}

/**
 * AI Response Source Collection
 * Stores glass-box transparency data for distributed audit
 */
export interface AIResponseSourceDocument {
  _id?: string;
  userId: string;
  instanceId: string;
  chatId: number;
  messageId: number;
  mode: "inspired" | "didactic" | "parallel";
  sourceType: "local" | "external" | "harmonized";
  provider: string;
  model: string;
  confidence: number | null;
  responseHash: string; // Hash of response for deduplication
  metadata: {
    localProvider?: string;
    externalProvider?: string;
    harmonizationStrategy?: string;
    mcpToolsUsed?: string[];
  };
  timestamp: Date;
}

/**
 * Sync Event Collection
 * Stores events for eventual consistency across instances
 */
export interface SyncEventDocument {
  _id?: string;
  userId: string;
  sourceInstanceId: string;
  eventType: 
    | "mode-changed"
    | "context-updated"
    | "response-generated"
    | "mcp-tool-executed"
    | "config-updated";
  eventData: Record<string, unknown>;
  targetInstances: string[] | null; // null means broadcast to all
  processedBy: string[]; // instanceIds that have processed this event
  priority: "high" | "normal" | "low";
  timestamp: Date;
  expiresAt: Date;
}

/**
 * MongoDB Collection Names
 */
export const MONGO_COLLECTIONS = {
  MODE_STATE: "mode_state",
  MODE_TRANSITIONS: "mode_transitions",
  DISTRIBUTED_CONTEXT: "distributed_context",
  AI_RESPONSE_SOURCES: "ai_response_sources",
  SYNC_EVENTS: "sync_events",
} as const;

/**
 * MongoDB Indexes
 */
export const MONGO_INDEXES = {
  MODE_STATE: [
    { key: { userId: 1, instanceId: 1 }, unique: true },
    { key: { updatedAt: -1 } },
    { key: { currentMode: 1, userId: 1 } },
  ],
  MODE_TRANSITIONS: [
    { key: { userId: 1, timestamp: -1 } },
    { key: { instanceId: 1, timestamp: -1 } },
    { key: { toMode: 1, success: 1 } },
  ],
  DISTRIBUTED_CONTEXT: [
    { key: { userId: 1, contextKey: 1 }, unique: true },
    { key: { contextType: 1, mode: 1 } },
    { key: { "metadata.version": -1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
  ],
  AI_RESPONSE_SOURCES: [
    { key: { userId: 1, chatId: 1, messageId: 1 }, unique: true },
    { key: { responseHash: 1 } },
    { key: { timestamp: -1 } },
    { key: { mode: 1, sourceType: 1 } },
  ],
  SYNC_EVENTS: [
    { key: { userId: 1, timestamp: -1 } },
    { key: { eventType: 1, priority: 1 } },
    { key: { targetInstances: 1, processedBy: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 }, // TTL index
  ],
} as const;
