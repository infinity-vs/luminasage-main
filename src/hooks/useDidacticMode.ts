import { useQuery } from "@tanstack/react-query";
import { IpcClient } from "../ipc/ipc_client";
import type {
  DidacticModeStatus,
  DidacticModeValidation,
  McpIntegrationStatus,
} from "../ipc/ipc_types";

/**
 * Hook for Didactic mode specific operations
 */
export function useDidacticMode() {
  // Query for Didactic mode status
  const {
    data: didacticStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<DidacticModeStatus>({
    queryKey: ["didactic-mode-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getDidacticModeStatus();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for Didactic mode validation
  const {
    data: validation,
    isLoading: isLoadingValidation,
    error: validationError,
    refetch: refetchValidation,
  } = useQuery<DidacticModeValidation>({
    queryKey: ["didactic-mode-validation"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.validateDidacticMode();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for recommended external provider
  const {
    data: recommendedProvider,
    isLoading: isLoadingRecommended,
    error: recommendedError,
  } = useQuery<string | null>({
    queryKey: ["didactic-mode-recommended-provider"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getRecommendedExternalProvider();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for MCP integration status
  const {
    data: mcpStatus,
    isLoading: isLoadingMcp,
    error: mcpError,
    refetch: refetchMcpStatus,
  } = useQuery<McpIntegrationStatus>({
    queryKey: ["didactic-mode-mcp-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getMcpIntegrationStatus();
    },
    meta: {
      showErrorToast: true,
    },
  });

  const isLoading =
    isLoadingStatus ||
    isLoadingValidation ||
    isLoadingRecommended ||
    isLoadingMcp;
  const error =
    statusError || validationError || recommendedError || mcpError;

  return {
    // Status data
    didacticStatus,
    validation,
    recommendedProvider,
    mcpStatus,

    // Derived states
    hasExternalAI: didacticStatus?.hasExternalAI ?? false,
    configuredProviders: didacticStatus?.configuredProviders ?? [],
    mcpServersEnabled: mcpStatus?.enabledCount ?? 0,
    mcpServersTotal: mcpStatus?.totalCount ?? 0,
    canActivate: validation?.canActivate ?? false,
    validationReason: validation?.reason,

    // Loading and errors
    isLoading,
    error,

    // Actions
    refetchStatus,
    refetchValidation,
    refetchMcpStatus,
  };
}
