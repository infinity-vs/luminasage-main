import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IpcClient } from "../ipc/ipc_client";
import type {
  AICollaborationMode,
  ModeStateSnapshot,
  SwitchModeParams,
  UpdateModeConfigurationParams,
} from "../ipc/ipc_types";
import { showError, showInfo } from "../lib/toast";

export function useAICollaborationMode() {
  const queryClient = useQueryClient();

  // Query for current mode state
  const {
    data: modeState,
    isLoading,
    error,
    refetch: refetchModeState,
  } = useQuery<ModeStateSnapshot>({
    queryKey: ["ai-collaboration-mode-state"],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getModeState();
    },
    meta: {
      showErrorToast: true,
    },
  });

  // Query for a specific mode status
  const getModeStatus = async (mode: AICollaborationMode) => {
    const ipcClient = IpcClient.getInstance();
    return await ipcClient.getModeStatus(mode);
  };

  // Mutation for switching modes
  const switchModeMutation = useMutation({
    mutationFn: async (params: SwitchModeParams) => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.switchMode(params);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["ai-collaboration-mode-state"],
      });
      showInfo(`Switched to ${result.mode.mode} mode`);
    },
    onError: (error) => {
      showError(error);
    },
  });

  // Mutation for updating mode configuration
  const updateConfigurationMutation = useMutation({
    mutationFn: async (params: UpdateModeConfigurationParams) => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.updateModeConfiguration(params);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["ai-collaboration-mode-state"],
      });
      showInfo(`Updated ${result.mode} mode configuration`);
    },
    onError: (error) => {
      showError(error);
    },
  });

  // Helper function to switch mode with context preservation
  const switchMode = async (
    targetMode: AICollaborationMode,
    contextSnapshot?: Record<string, unknown>,
  ) => {
    if (!targetMode) {
      throw new Error("Target mode is required");
    }
    return await switchModeMutation.mutateAsync({
      targetMode,
      contextSnapshot: contextSnapshot || null,
    });
  };

  // Helper function to update mode configuration
  const updateConfiguration = async (
    mode: AICollaborationMode,
    configuration: Record<string, unknown> | null,
  ) => {
    if (!mode) {
      throw new Error("Mode is required");
    }
    return await updateConfigurationMutation.mutateAsync({
      mode,
      configuration,
    });
  };

  // Get the current active mode
  const currentMode = modeState?.currentMode || "inspired";

  // Get the current active mode status
  const currentModeStatus =
    modeState?.availableModes.find((m) => m.mode === currentMode) || null;

  return {
    // State
    modeState,
    currentMode,
    currentModeStatus,
    availableModes: modeState?.availableModes || [],
    modeHistory: modeState?.modeHistory || [],

    // Loading states
    isLoading,
    error,
    isSwitching: switchModeMutation.isPending,
    isUpdating: updateConfigurationMutation.isPending,

    // Actions
    switchMode,
    updateConfiguration,
    getModeStatus,
    refetchModeState,
  };
}

// Query for mode transition history
export function useModeTransitionHistory(limit = 20) {
  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mode-transition-history", limit],
    queryFn: async () => {
      const ipcClient = IpcClient.getInstance();
      return await ipcClient.getModeTransitionHistory(limit);
    },
    meta: {
      showErrorToast: true,
    },
  });

  return {
    history: history || [],
    isLoading,
    error,
  };
}
