import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IpcClient } from "../ipc/ipc_client";
import type { DistributedMemoryStatus, DistributedMemoryConfig } from "../ipc/ipc_types";
import { showError, showInfo } from "../lib/toast";

/**
 * Hook for distributed memory operations
 */
export function useDistributedMemory() {
  const queryClient = useQueryClient();

  // Query for distributed memory status
  const {
    data: status,
    isLoading,
    error,
    refetch: refetchStatus,
  } = useQuery<DistributedMemoryStatus>({
    queryKey: ["distributed-memory-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getDistributedMemoryStatus();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    meta: {
      showErrorToast: false, // Don't show errors for polling
    },
  });

  // Mutation for initializing distributed memory
  const initializeMutation = useMutation({
    mutationFn: async (config: DistributedMemoryConfig) => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.initializeDistributedMemory(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["distributed-memory-status"],
      });
      showInfo("Distributed memory initialized successfully");
    },
    onError: (error) => {
      showError(error);
    },
  });

  // Mutation for shutting down distributed memory
  const shutdownMutation = useMutation({
    mutationFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.shutdownDistributedMemory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["distributed-memory-status"],
      });
      showInfo("Distributed memory shut down");
    },
    onError: (error) => {
      showError(error);
    },
  });

  // Helper to publish mode change
  const publishModeChange = async (params: {
    userId: string;
    fromMode: "inspired" | "didactic" | "parallel" | null;
    toMode: "inspired" | "didactic" | "parallel";
    configuration?: Record<string, unknown>;
  }) => {
    const ipcClient = IpcClient.getInstance();
    await ipcClient.publishModeChange(params);
  };

  // Helper to publish context update
  const publishContextUpdate = async (params: {
    userId: string;
    contextKey: string;
    contextType: "chat" | "project" | "mode" | "custom";
    data: Record<string, unknown>;
  }) => {
    const ipcClient = IpcClient.getInstance();
    await ipcClient.publishContextUpdate(params);
  };

  return {
    // Status
    status,
    isLoading,
    error,

    // Derived states
    isMongoDBConnected: status?.mongodb.connected ?? false,
    isRedisConnected: status?.redis.connected ?? false,
    isWebSocketRunning: status?.websocket.running ?? false,
    isFullyOperational: status?.isFullyOperational ?? false,
    instanceId: status?.instanceId ?? null,
    wsClientCount: status?.websocket.clientCount ?? 0,

    // Mutations
    initialize: initializeMutation.mutateAsync,
    shutdown: shutdownMutation.mutateAsync,
    isInitializing: initializeMutation.isPending,
    isShuttingDown: shutdownMutation.isPending,

    // Actions
    publishModeChange,
    publishContextUpdate,
    refetchStatus,
  };
}
