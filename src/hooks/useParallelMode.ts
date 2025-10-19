import { useQuery } from "@tanstack/react-query";
import { IpcClient } from "../ipc/ipc_client";
import type {
  ParallelModeStatus,
  ParallelModeValidation,
  ParallelModeStrategy,
  AISource,
  McpCoordinatorStatus,
} from "../ipc/ipc_types";

/**
 * Hook for Parallel mode specific operations
 */
export function useParallelMode() {
  // Query for Parallel mode status
  const {
    data: parallelStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<ParallelModeStatus>({
    queryKey: ["parallel-mode-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getParallelModeStatus();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for Parallel mode validation
  const {
    data: validation,
    isLoading: isLoadingValidation,
    error: validationError,
    refetch: refetchValidation,
  } = useQuery<ParallelModeValidation>({
    queryKey: ["parallel-mode-validation"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.validateParallelMode();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for Parallel mode strategy
  const {
    data: strategy,
    isLoading: isLoadingStrategy,
    error: strategyError,
  } = useQuery<ParallelModeStrategy>({
    queryKey: ["parallel-mode-strategy"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getParallelModeStrategy();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for available AI sources
  const {
    data: aiSources,
    isLoading: isLoadingSources,
    error: sourcesError,
  } = useQuery<AISource[]>({
    queryKey: ["parallel-mode-ai-sources"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getAvailableAISources();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for MCP coordinator status
  const {
    data: mcpCoordinator,
    isLoading: isLoadingMcp,
    error: mcpError,
    refetch: refetchMcpCoordinator,
  } = useQuery<McpCoordinatorStatus>({
    queryKey: ["parallel-mode-mcp-coordinator"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getMcpCoordinatorStatus();
    },
    meta: {
      showErrorToast: true,
    },
  });

  const isLoading =
    isLoadingStatus ||
    isLoadingValidation ||
    isLoadingStrategy ||
    isLoadingSources ||
    isLoadingMcp;
  const error =
    statusError || validationError || strategyError || sourcesError || mcpError;

  return {
    // Status data
    parallelStatus,
    validation,
    strategy,
    aiSources,
    mcpCoordinator,

    // Derived states
    hasLocalAI: parallelStatus?.hasLocalAI ?? false,
    hasExternalAI: parallelStatus?.hasExternalAI ?? false,
    localModels: parallelStatus?.localModels ?? 0,
    externalProviders: parallelStatus?.externalProviders ?? 0,
    mcpServersEnabled: parallelStatus?.mcpServersEnabled ?? 0,
    canActivate: validation?.canActivate ?? false,
    validationReason: validation?.reason,
    
    // Strategy details
    primarySource: strategy?.primary,
    secondarySource: strategy?.secondary,
    hasMultipleSources: !!strategy?.secondary,
    useGlassBox: strategy?.useGlassBox ?? true,
    
    // MCP coordination
    totalMcpTools: mcpCoordinator?.totalTools ?? 0,
    mcpIsReady: mcpCoordinator?.isReady ?? false,

    // Loading and errors
    isLoading,
    error,

    // Actions
    refetchStatus,
    refetchValidation,
    refetchMcpCoordinator,
  };
}
