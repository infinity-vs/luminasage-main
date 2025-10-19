import { useQuery } from "@tanstack/react-query";
import { IpcClient } from "../ipc/ipc_client";
import type { InspiredModeStatus, InspiredModeValidation } from "../ipc/ipc_types";

/**
 * Hook for Inspired mode specific operations
 */
export function useInspiredMode() {
  // Query for Inspired mode status
  const {
    data: inspiredStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<InspiredModeStatus>({
    queryKey: ["inspired-mode-status"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getInspiredModeStatus();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for Inspired mode validation
  const {
    data: validation,
    isLoading: isLoadingValidation,
    error: validationError,
    refetch: refetchValidation,
  } = useQuery<InspiredModeValidation>({
    queryKey: ["inspired-mode-validation"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.validateInspiredMode();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for recommended Ollama model
  const {
    data: recommendedModel,
    isLoading: isLoadingRecommended,
    error: recommendedError,
  } = useQuery<string | null>({
    queryKey: ["inspired-mode-recommended-model"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getRecommendedOllamaModel();
    },
    meta: {
      showErrorToast: true,
    },
  });

  const isLoading =
    isLoadingStatus || isLoadingValidation || isLoadingRecommended;
  const error = statusError || validationError || recommendedError;

  return {
    // Status data
    inspiredStatus,
    validation,
    recommendedModel,

    // Derived states
    isOllamaAvailable: inspiredStatus?.isOllamaAvailable ?? false,
    availableModels: inspiredStatus?.availableModels ?? [],
    canActivate: validation?.canActivate ?? false,
    validationReason: validation?.reason,

    // Loading and errors
    isLoading,
    error,

    // Actions
    refetchStatus,
    refetchValidation,
  };
}
