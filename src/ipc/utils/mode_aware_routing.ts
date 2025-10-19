/**
 * Mode-Aware Chat Routing
 * 
 * This module handles routing chat requests based on the active AI collaboration mode.
 * It ensures that each mode uses appropriate AI providers and configurations.
 */

import log from "electron-log";
import { db } from "../../db";
import { aiCollaborationModes } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { AICollaborationMode } from "../ipc_types";
import type { LargeLanguageModel, UserSettings } from "../../lib/schemas";
import { checkInspiredModeStatus, getBestOllamaModelForCoding } from "./inspired_mode_utils";

const logger = log.scope("mode_aware_routing");

/**
 * Get the currently active collaboration mode
 */
export async function getActiveCollaborationMode(): Promise<AICollaborationMode> {
  const activeModes = await db
    .select()
    .from(aiCollaborationModes)
    .where(eq(aiCollaborationModes.isActive, true));

  if (activeModes.length === 0) {
    // Default to inspired mode if none is active
    logger.info("No active mode found, defaulting to 'inspired'");
    return "inspired";
  }

  return activeModes[0].mode as AICollaborationMode;
}

/**
 * Get the appropriate model for the active collaboration mode
 * 
 * This function ensures that:
 * - Inspired mode uses local Ollama models only
 * - Didactic mode uses external AI services
 * - Parallel mode can use both
 */
export async function getModeAwareModel(
  requestedModel: LargeLanguageModel,
  settings: UserSettings,
): Promise<LargeLanguageModel> {
  const activeMode = await getActiveCollaborationMode();

  logger.info(`Active collaboration mode: ${activeMode}`);

  switch (activeMode) {
    case "inspired": {
      // Inspired mode: Enforce local Ollama models only
      if (requestedModel.provider === "ollama") {
        logger.info("Inspired mode: Using requested Ollama model", requestedModel);
        return requestedModel;
      }

      // Check if Ollama is available
      const inspiredStatus = await checkInspiredModeStatus();
      
      if (!inspiredStatus.isOllamaAvailable) {
        throw new Error(
          "Inspired mode requires Ollama to be running. Please start Ollama or switch to a different mode."
        );
      }

      if (inspiredStatus.availableModels.length === 0) {
        throw new Error(
          "No Ollama models found. Please install at least one model using 'ollama pull <model-name>'."
        );
      }

      // Override with recommended Ollama model
      const recommendedModel = await getBestOllamaModelForCoding();
      
      if (!recommendedModel) {
        // Fall back to first available model
        const fallbackModel = inspiredStatus.availableModels[0].modelName;
        logger.warn(
          `Inspired mode: No recommended model found, using fallback: ${fallbackModel}`
        );
        return {
          provider: "ollama",
          name: fallbackModel,
        };
      }

      logger.info(
        `Inspired mode: Overriding model to recommended Ollama model: ${recommendedModel}`
      );
      
      return {
        provider: "ollama",
        name: recommendedModel,
      };
    }

    case "didactic": {
      // Didactic mode: External AI only (no local models)
      if (requestedModel.provider === "ollama" || requestedModel.provider === "lmstudio") {
        logger.warn(
          `Didactic mode does not support local model: ${requestedModel.provider}. Using external AI instead.`
        );
        
        // Use the user's preferred external model or default
        if (settings.selectedModel?.provider && 
            settings.selectedModel.provider !== "ollama" && 
            settings.selectedModel.provider !== "lmstudio") {
          return settings.selectedModel;
        }
        
        // Fall back to auto if no suitable model is configured
        return { provider: "auto", name: "free" };
      }

      logger.info("Didactic mode: Using external model", requestedModel);
      return requestedModel;
    }

    case "parallel": {
      // Parallel mode: Both local and external are allowed
      logger.info("Parallel mode: Using requested model", requestedModel);
      return requestedModel;
    }

    default: {
      logger.warn(`Unknown collaboration mode: ${activeMode}, using requested model`);
      return requestedModel;
    }
  }
}

/**
 * Check if a model provider is allowed in the current mode
 */
export async function isModelProviderAllowed(
  provider: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const activeMode = await getActiveCollaborationMode();

  switch (activeMode) {
    case "inspired":
      if (provider === "ollama") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Inspired mode only supports local Ollama models",
      };

    case "didactic":
      if (provider === "ollama" || provider === "lmstudio") {
        return {
          allowed: false,
          reason: "Didactic mode does not support local models",
        };
      }
      return { allowed: true };

    case "parallel":
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Validate that the current mode can handle the requested model
 */
export async function validateModeModelCompatibility(
  model: LargeLanguageModel,
): Promise<{ compatible: boolean; reason?: string }> {
  const activeMode = await getActiveCollaborationMode();
  const providerCheck = await isModelProviderAllowed(model.provider);

  if (!providerCheck.allowed) {
    return {
      compatible: false,
      reason: `In ${activeMode} mode: ${providerCheck.reason}`,
    };
  }

  // For inspired mode, verify Ollama is actually available
  if (activeMode === "inspired") {
    const inspiredStatus = await checkInspiredModeStatus();
    
    if (!inspiredStatus.isOllamaAvailable) {
      return {
        compatible: false,
        reason: "Ollama is not running. Please start Ollama to use Inspired mode.",
      };
    }

    if (inspiredStatus.availableModels.length === 0) {
      return {
        compatible: false,
        reason: "No Ollama models found. Please install at least one model.",
      };
    }
  }

  return { compatible: true };
}
