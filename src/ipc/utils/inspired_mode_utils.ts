/**
 * Inspired Mode Utilities
 * 
 * This module provides utilities for the Inspired mode, which focuses on
 * local-first AI collaboration using Ollama models with a contemplative UI.
 */

import log from "electron-log";
import { fetchOllamaModels } from "../handlers/local_model_ollama_handler";
import type { LocalModel } from "../ipc_types";

const logger = log.scope("inspired_mode");

export interface InspiredModeStatus {
  isOllamaAvailable: boolean;
  availableModels: LocalModel[];
  recommendedModel: string | null;
  isOfflineCapable: boolean;
}

/**
 * Check if Ollama is available and return status information
 */
export async function checkInspiredModeStatus(): Promise<InspiredModeStatus> {
  try {
    const result = await fetchOllamaModels();
    const models = result.models || [];

    // Find the best recommended model for coding
    // Prioritize: qwen2.5-coder, codellama, deepseek-coder, llama3, etc.
    const recommendedModelNames = [
      "qwen2.5-coder",
      "qwen3-coder",
      "codellama",
      "deepseek-coder",
      "llama3",
      "mistral",
      "gemma2",
    ];

    let recommendedModel: string | null = null;
    for (const recName of recommendedModelNames) {
      const found = models.find((m) =>
        m.modelName.toLowerCase().includes(recName),
      );
      if (found) {
        recommendedModel = found.modelName;
        break;
      }
    }

    // If no recommended model found but models exist, use the first one
    if (!recommendedModel && models.length > 0) {
      recommendedModel = models[0].modelName;
    }

    logger.info(
      `Inspired mode status: Ollama available with ${models.length} models. Recommended: ${recommendedModel}`,
    );

    return {
      isOllamaAvailable: true,
      availableModels: models,
      recommendedModel,
      isOfflineCapable: true,
    };
  } catch (error) {
    logger.warn("Ollama not available for Inspired mode", error);
    return {
      isOllamaAvailable: false,
      availableModels: [],
      recommendedModel: null,
      isOfflineCapable: false,
    };
  }
}

/**
 * Validate that Inspired mode can be activated
 */
export async function validateInspiredModeRequirements(): Promise<{
  canActivate: boolean;
  reason?: string;
}> {
  const status = await checkInspiredModeStatus();

  if (!status.isOllamaAvailable) {
    return {
      canActivate: false,
      reason:
        "Ollama is not running. Please start Ollama to use Inspired mode.",
    };
  }

  if (status.availableModels.length === 0) {
    return {
      canActivate: false,
      reason:
        "No Ollama models found. Please pull at least one model using 'ollama pull <model-name>'.",
    };
  }

  return {
    canActivate: true,
  };
}

/**
 * Get the best Ollama model for coding tasks
 */
export async function getBestOllamaModelForCoding(): Promise<string | null> {
  const status = await checkInspiredModeStatus();
  return status.recommendedModel;
}

/**
 * Configuration for Inspired mode's contemplative UI
 */
export interface InspiredModeUIConfig {
  enableMinimalDistraction: boolean;
  enableFlowStateIndicators: boolean;
  enableSoftTransitions: boolean;
  themeVariant: "calm" | "focus" | "default";
}

export const DEFAULT_INSPIRED_UI_CONFIG: InspiredModeUIConfig = {
  enableMinimalDistraction: true,
  enableFlowStateIndicators: true,
  enableSoftTransitions: true,
  themeVariant: "calm",
};

/**
 * Get Inspired mode UI configuration from mode configuration
 */
export function getInspiredModeUIConfig(
  modeConfiguration: Record<string, unknown> | null,
): InspiredModeUIConfig {
  if (!modeConfiguration) {
    return DEFAULT_INSPIRED_UI_CONFIG;
  }

  return {
    enableMinimalDistraction:
      (modeConfiguration.enableMinimalDistraction as boolean) ??
      DEFAULT_INSPIRED_UI_CONFIG.enableMinimalDistraction,
    enableFlowStateIndicators:
      (modeConfiguration.enableFlowStateIndicators as boolean) ??
      DEFAULT_INSPIRED_UI_CONFIG.enableFlowStateIndicators,
    enableSoftTransitions:
      (modeConfiguration.enableSoftTransitions as boolean) ??
      DEFAULT_INSPIRED_UI_CONFIG.enableSoftTransitions,
    themeVariant:
      (modeConfiguration.themeVariant as "calm" | "focus" | "default") ??
      DEFAULT_INSPIRED_UI_CONFIG.themeVariant,
  };
}
