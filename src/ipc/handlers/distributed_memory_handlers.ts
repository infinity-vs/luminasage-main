import { IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { createLoggedHandler } from "./safe_handle";
import { distributedMemoryManager } from "../../distributed/distributed_memory_manager";
import type { DistributedMemoryConfig, DistributedMemoryStatus } from "../ipc_types";

const logger = log.scope("distributed_memory_handlers");
const handle = createLoggedHandler(logger);

export function registerDistributedMemoryHandlers() {
  // Initialize distributed memory systems
  handle(
    "distributed:initialize",
    async (
      _event: IpcMainInvokeEvent,
      config: DistributedMemoryConfig,
    ): Promise<void> => {
      logger.info("Initializing distributed memory", {
        mongodb: config.enableMongoDB,
        redis: config.enableRedis,
        websocket: config.enableWebSocket,
      });

      await distributedMemoryManager.initialize(config);
    },
  );

  // Get distributed memory status
  handle(
    "distributed:get-status",
    async (): Promise<DistributedMemoryStatus> => {
      return await distributedMemoryManager.getStatus();
    },
  );

  // Shutdown distributed memory
  handle("distributed:shutdown", async (): Promise<void> => {
    await distributedMemoryManager.shutdown();
  });

  // Publish mode change to distributed system
  handle(
    "distributed:publish-mode-change",
    async (
      _event: IpcMainInvokeEvent,
      params: {
        userId: string;
        fromMode: "inspired" | "didactic" | "parallel" | null;
        toMode: "inspired" | "didactic" | "parallel";
        configuration?: Record<string, unknown>;
      },
    ): Promise<void> => {
      await distributedMemoryManager.publishModeChange(
        params.userId,
        params.fromMode,
        params.toMode,
        params.configuration,
      );
    },
  );

  // Publish context update to distributed system
  handle(
    "distributed:publish-context-update",
    async (
      _event: IpcMainInvokeEvent,
      params: {
        userId: string;
        contextKey: string;
        contextType: "chat" | "project" | "mode" | "custom";
        data: Record<string, unknown>;
      },
    ): Promise<void> => {
      await distributedMemoryManager.publishContextUpdate(
        params.userId,
        params.contextKey,
        params.contextType,
        params.data,
      );
    },
  );

  // Store AI response source for glass-box transparency
  handle(
    "distributed:store-response-source",
    async (
      _event: IpcMainInvokeEvent,
      params: {
        userId: string;
        chatId: number;
        messageId: number;
        mode: "inspired" | "didactic" | "parallel";
        source: {
          sourceType: "local" | "external" | "harmonized";
          provider: string;
          model: string;
          confidence?: number;
          metadata?: Record<string, unknown>;
        };
        responseHash: string;
      },
    ): Promise<void> => {
      await distributedMemoryManager.storeResponseSource(
        params.userId,
        params.chatId,
        params.messageId,
        params.mode,
        params.source,
        params.responseHash,
      );
    },
  );
}
