import { IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { db } from "../../db";
import {
  aiCollaborationModes,
  modeCapabilities,
  modeTransitionHistory,
} from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { createLoggedHandler } from "./safe_handle";
import type {
  AICollaborationMode,
  AICollaborationModeStatus,
  ModeStateSnapshot,
  SwitchModeParams,
  SwitchModeResult,
  UpdateModeConfigurationParams,
  ModeCapabilityDescriptor,
  ModeTransitionRecord,
  InspiredModeStatus,
  InspiredModeValidation,
  DidacticModeStatus,
  DidacticModeValidation,
  McpIntegrationStatus,
  ParallelModeStatus,
  ParallelModeValidation,
  ParallelModeStrategy,
  AISource,
  McpCoordinatorStatus,
} from "../ipc_types";
import {
  checkInspiredModeStatus,
  validateInspiredModeRequirements,
  getBestOllamaModelForCoding,
} from "../utils/inspired_mode_utils";
import {
  checkDidacticModeStatus,
  validateDidacticModeRequirements,
  getRecommendedExternalProvider,
  checkMcpIntegration,
} from "../utils/didactic_mode_utils";
import {
  checkParallelModeStatus,
  validateParallelModeRequirements,
  determineParallelStrategy,
  getAvailableAISources,
} from "../utils/parallel_mode_utils";
import { multiMcpCoordinator } from "../utils/multi_mcp_coordinator";
import { readSettings } from "../../main/settings";

const logger = log.scope("mode_handlers");
const handle = createLoggedHandler(logger);

// Helper function to get mode with capabilities
async function getModeWithCapabilities(
  mode: AICollaborationMode,
): Promise<AICollaborationModeStatus | null> {
  const modeRecords = await db
    .select()
    .from(aiCollaborationModes)
    .where(eq(aiCollaborationModes.mode, mode));

  if (modeRecords.length === 0) {
    return null;
  }

  const modeRecord = modeRecords[0];

  const capabilityRecords = await db
    .select()
    .from(modeCapabilities)
    .where(eq(modeCapabilities.mode, mode));

  let capabilityDescriptor: ModeCapabilityDescriptor;
  if (capabilityRecords.length > 0) {
    const cap = capabilityRecords[0];
    capabilityDescriptor = {
      mode,
      localAI: !!cap.localAI,
      externalAI: !!cap.externalAI,
      multiChannel: !!cap.multiChannel,
      offlineCapable: !!cap.offlineCapable,
      realTimeSync: !!cap.realTimeSync,
      mcpServerIds: (cap.mcpServerIds as number[]) || undefined,
    };
  } else {
    // Default capabilities based on mode type
    capabilityDescriptor = getDefaultCapabilities(mode);
  }

  return {
    mode: modeRecord.mode as AICollaborationMode,
    isActive: !!modeRecord.isActive,
    lastActivatedAt: modeRecord.lastActivatedAt
      ? modeRecord.lastActivatedAt.toISOString()
      : null,
    configuration:
      (modeRecord.configuration as Record<string, unknown>) || null,
    capabilities: capabilityDescriptor,
  };
}

// Default capabilities for each mode type
function getDefaultCapabilities(
  mode: AICollaborationMode,
): ModeCapabilityDescriptor {
  switch (mode) {
    case "inspired":
      return {
        mode,
        localAI: true,
        externalAI: false,
        multiChannel: false,
        offlineCapable: true,
        realTimeSync: false,
      };
    case "didactic":
      return {
        mode,
        localAI: false,
        externalAI: true,
        multiChannel: false,
        offlineCapable: false,
        realTimeSync: true,
      };
    case "parallel":
      return {
        mode,
        localAI: true,
        externalAI: true,
        multiChannel: true,
        offlineCapable: false,
        realTimeSync: true,
      };
  }
}

// Initialize modes if they don't exist
async function ensureModesExist() {
  const modes: AICollaborationMode[] = ["inspired", "didactic", "parallel"];

  for (const mode of modes) {
    const existing = await db
      .select()
      .from(aiCollaborationModes)
      .where(eq(aiCollaborationModes.mode, mode));

    if (existing.length === 0) {
      await db.insert(aiCollaborationModes).values({
        mode,
        isActive: mode === "inspired", // Default to inspired mode
        configuration: null,
        lastActivatedAt: mode === "inspired" ? new Date() : null,
      });

      // Also create default capabilities
      const defaultCap = getDefaultCapabilities(mode);
      await db.insert(modeCapabilities).values({
        mode,
        localAI: defaultCap.localAI,
        externalAI: defaultCap.externalAI,
        multiChannel: defaultCap.multiChannel,
        offlineCapable: defaultCap.offlineCapable,
        realTimeSync: defaultCap.realTimeSync,
        mcpServerIds: null,
      });
    }
  }
}

export function registerModeHandlers() {
  // Get current mode state snapshot
  handle("mode:get-state", async (): Promise<ModeStateSnapshot> => {
    await ensureModesExist();

    const allModes = await db.select().from(aiCollaborationModes);
    const availableModes: AICollaborationModeStatus[] = [];

    for (const modeRecord of allModes) {
      const status = await getModeWithCapabilities(
        modeRecord.mode as AICollaborationMode,
      );
      if (status) {
        availableModes.push(status);
      }
    }

    const activeModes = availableModes.filter((m) => m.isActive);
    const currentMode =
      activeModes.length > 0 ? activeModes[0].mode : "inspired";

    // Get recent mode history
    const historyRecords = await db
      .select()
      .from(modeTransitionHistory)
      .orderBy(desc(modeTransitionHistory.createdAt))
      .limit(10);

    const modeHistory: ModeTransitionRecord[] = historyRecords.map((h) => ({
      id: h.id,
      fromMode: h.fromMode as AICollaborationMode | null,
      toMode: h.toMode as AICollaborationMode,
      transitionDuration: h.transitionDuration,
      success: !!h.success,
      errorMessage: h.errorMessage,
      createdAt: h.createdAt.toISOString(),
    }));

    // Find previous mode from history
    const previousMode =
      modeHistory.length > 0 && modeHistory[0].fromMode
        ? modeHistory[0].fromMode
        : null;

    return {
      currentMode,
      previousMode,
      availableModes,
      modeHistory,
    };
  });

  // Get a specific mode status
  handle(
    "mode:get-mode-status",
    async (
      _event: IpcMainInvokeEvent,
      mode: AICollaborationMode,
    ): Promise<AICollaborationModeStatus | null> => {
      await ensureModesExist();
      return await getModeWithCapabilities(mode);
    },
  );

  // Switch to a different mode
  handle(
    "mode:switch-mode",
    async (
      _event: IpcMainInvokeEvent,
      params: SwitchModeParams,
    ): Promise<SwitchModeResult> => {
      const startTime = Date.now();
      await ensureModesExist();

      try {
        // Get current active mode
        const currentModes = await db
          .select()
          .from(aiCollaborationModes)
          .where(eq(aiCollaborationModes.isActive, true));
        const currentMode =
          currentModes.length > 0
            ? (currentModes[0].mode as AICollaborationMode)
            : null;

        if (currentMode === params.targetMode) {
          throw new Error(
            `Already in ${params.targetMode} mode. No switch needed.`,
          );
        }

        // Deactivate current mode
        if (currentMode) {
          await db
            .update(aiCollaborationModes)
            .set({ isActive: false })
            .where(eq(aiCollaborationModes.mode, currentMode));
        }

        // Activate target mode
        await db
          .update(aiCollaborationModes)
          .set({ isActive: true, lastActivatedAt: new Date() })
          .where(eq(aiCollaborationModes.mode, params.targetMode));

        const transitionDuration = Date.now() - startTime;

        // Record transition in history
        const historyResult = await db
          .insert(modeTransitionHistory)
          .values({
            fromMode: currentMode,
            toMode: params.targetMode,
            contextSnapshot: params.contextSnapshot || null,
            transitionDuration,
            success: true,
            errorMessage: null,
          })
          .returning();

        const newModeStatus = await getModeWithCapabilities(params.targetMode);
        if (!newModeStatus) {
          throw new Error(
            `Failed to retrieve status for mode ${params.targetMode}`,
          );
        }

        logger.info(
          `Mode switched from ${currentMode || "none"} to ${params.targetMode} in ${transitionDuration}ms`,
        );

        return {
          mode: newModeStatus,
          transition: {
            id: historyResult[0].id,
            fromMode: currentMode,
            toMode: params.targetMode,
            transitionDuration,
            success: true,
            errorMessage: null,
            createdAt: historyResult[0].createdAt.toISOString(),
          },
          preservedContext: params.contextSnapshot || null,
        };
      } catch (error) {
        const transitionDuration = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Record failed transition
        await db.insert(modeTransitionHistory).values({
          fromMode: null,
          toMode: params.targetMode,
          contextSnapshot: null,
          transitionDuration,
          success: false,
          errorMessage,
        });

        logger.error(`Mode switch failed: ${errorMessage}`);

        throw new Error(`Mode switch failed: ${errorMessage}`);
      }
    },
  );

  // Update mode configuration
  handle(
    "mode:update-configuration",
    async (
      _event: IpcMainInvokeEvent,
      params: UpdateModeConfigurationParams,
    ): Promise<AICollaborationModeStatus> => {
      await ensureModesExist();

      await db
        .update(aiCollaborationModes)
        .set({
          configuration: params.configuration,
          updatedAt: new Date(),
        })
        .where(eq(aiCollaborationModes.mode, params.mode));

      const updated = await getModeWithCapabilities(params.mode);
      if (!updated) {
        throw new Error(
          `Failed to update configuration for mode ${params.mode}`,
        );
      }

      logger.info(`Updated configuration for mode ${params.mode}`);
      return updated;
    },
  );

  // Get transition history
  handle(
    "mode:get-transition-history",
    async (
      _event: IpcMainInvokeEvent,
      limit = 20,
    ): Promise<ModeTransitionRecord[]> => {
      const historyRecords = await db
        .select()
        .from(modeTransitionHistory)
        .orderBy(desc(modeTransitionHistory.createdAt))
        .limit(limit);

      return historyRecords.map((h) => ({
        id: h.id,
        fromMode: h.fromMode as AICollaborationMode | null,
        toMode: h.toMode as AICollaborationMode,
        transitionDuration: h.transitionDuration,
        success: !!h.success,
        errorMessage: h.errorMessage,
        createdAt: h.createdAt.toISOString(),
      }));
    },
  );

  // --- Inspired Mode Specific Handlers ---

  // Get Inspired mode status (Ollama availability, models, etc.)
  handle(
    "mode:inspired:get-status",
    async (): Promise<InspiredModeStatus> => {
      return await checkInspiredModeStatus();
    },
  );

  // Validate if Inspired mode can be activated
  handle(
    "mode:inspired:validate",
    async (): Promise<InspiredModeValidation> => {
      return await validateInspiredModeRequirements();
    },
  );

  // Get the best Ollama model for coding
  handle(
    "mode:inspired:get-recommended-model",
    async (): Promise<string | null> => {
      return await getBestOllamaModelForCoding();
    },
  );

  // --- Didactic Mode Specific Handlers ---

  // Get Didactic mode status (external AI availability, MCP servers, etc.)
  handle(
    "mode:didactic:get-status",
    async (): Promise<DidacticModeStatus> => {
      const settings = await readSettings();
      return await checkDidacticModeStatus(settings);
    },
  );

  // Validate if Didactic mode can be activated
  handle(
    "mode:didactic:validate",
    async (): Promise<DidacticModeValidation> => {
      const settings = await readSettings();
      return await validateDidacticModeRequirements(settings);
    },
  );

  // Get the recommended external provider for Didactic mode
  handle(
    "mode:didactic:get-recommended-provider",
    async (): Promise<string | null> => {
      const settings = await readSettings();
      return await getRecommendedExternalProvider(settings);
    },
  );

  // Get MCP integration status
  handle(
    "mode:didactic:get-mcp-status",
    async (): Promise<McpIntegrationStatus> => {
      return await checkMcpIntegration();
    },
  );

  // --- Parallel Mode Specific Handlers ---

  // Get Parallel mode status (local + external AI availability)
  handle(
    "mode:parallel:get-status",
    async (): Promise<ParallelModeStatus> => {
      const settings = await readSettings();
      return await checkParallelModeStatus(settings);
    },
  );

  // Validate if Parallel mode can be activated
  handle(
    "mode:parallel:validate",
    async (): Promise<ParallelModeValidation> => {
      const settings = await readSettings();
      return await validateParallelModeRequirements(settings);
    },
  );

  // Get Parallel mode strategy (which AI sources to use)
  handle(
    "mode:parallel:get-strategy",
    async (): Promise<ParallelModeStrategy> => {
      const settings = await readSettings();
      return await determineParallelStrategy(settings);
    },
  );

  // Get available AI sources
  handle(
    "mode:parallel:get-sources",
    async (): Promise<AISource[]> => {
      const settings = await readSettings();
      return await getAvailableAISources(settings);
    },
  );

  // Get multi-MCP coordinator status
  handle(
    "mode:parallel:get-mcp-coordinator-status",
    async (): Promise<McpCoordinatorStatus> => {
      return await multiMcpCoordinator.getStatus();
    },
  );
}
