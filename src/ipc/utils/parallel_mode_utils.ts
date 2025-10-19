/**
 * Parallel Mode Utilities
 * 
 * This module provides utilities for the Parallel mode, which enables
 * hybrid local + external AI coordination with glass-box transparency.
 */

import log from "electron-log";
import { checkInspiredModeStatus } from "./inspired_mode_utils";
import { checkDidacticModeStatus } from "./didactic_mode_utils";
import type { UserSettings } from "../../lib/schemas";

const logger = log.scope("parallel_mode");

export interface ParallelModeStatus {
  hasLocalAI: boolean;
  hasExternalAI: boolean;
  localModels: number;
  externalProviders: number;
  mcpServersEnabled: number;
  isReady: boolean;
  issues: string[];
}

export interface AISource {
  type: "local" | "external";
  provider: string;
  model: string;
  isAvailable: boolean;
}

export interface ParallelModeStrategy {
  primary: AISource;
  secondary?: AISource;
  useGlassBox: boolean;
  enableHarmonization: boolean;
  conflictResolution: "primary-wins" | "merge" | "vote";
}

/**
 * Check if Parallel mode has both local and external AI available
 */
export async function checkParallelModeStatus(
  settings: UserSettings,
): Promise<ParallelModeStatus> {
  const issues: string[] = [];

  // Check local AI (Inspired mode components)
  const inspiredStatus = await checkInspiredModeStatus();
  const hasLocalAI = inspiredStatus.isOllamaAvailable;
  const localModels = inspiredStatus.availableModels.length;

  if (!hasLocalAI) {
    issues.push(
      "Local AI (Ollama) not available. Install Ollama for full Parallel mode capabilities.",
    );
  }

  // Check external AI (Didactic mode components)
  const didacticStatus = await checkDidacticModeStatus(settings);
  const hasExternalAI = didacticStatus.hasExternalAI;
  const externalProviders = didacticStatus.configuredProviders.length;
  const mcpServersEnabled = didacticStatus.enabledMcpServersCount;

  if (!hasExternalAI) {
    issues.push(
      "External AI not configured. Add an API key in Settings for full Parallel mode capabilities.",
    );
  }

  // Parallel mode is ready if at least one AI source is available
  const isReady = hasLocalAI || hasExternalAI;

  if (!isReady) {
    issues.push(
      "No AI sources available. Configure either Ollama or an external provider.",
    );
  }

  logger.info(
    `Parallel mode status: Local=${hasLocalAI}, External=${hasExternalAI}, Ready=${isReady}`,
  );

  return {
    hasLocalAI,
    hasExternalAI,
    localModels,
    externalProviders,
    mcpServersEnabled,
    isReady,
    issues,
  };
}

/**
 * Validate that Parallel mode can be activated
 */
export async function validateParallelModeRequirements(
  settings: UserSettings,
): Promise<{
  canActivate: boolean;
  reason?: string;
}> {
  const status = await checkParallelModeStatus(settings);

  if (!status.isReady) {
    return {
      canActivate: false,
      reason:
        "Parallel mode requires at least one AI source (local Ollama or external provider). Please configure one.",
    };
  }

  return {
    canActivate: true,
  };
}

/**
 * Get available AI sources for Parallel mode
 */
export async function getAvailableAISources(
  settings: UserSettings,
): Promise<AISource[]> {
  const sources: AISource[] = [];

  // Check local AI
  const inspiredStatus = await checkInspiredModeStatus();
  if (inspiredStatus.isOllamaAvailable && inspiredStatus.recommendedModel) {
    sources.push({
      type: "local",
      provider: "ollama",
      model: inspiredStatus.recommendedModel,
      isAvailable: true,
    });
  }

  // Check external AI
  const didacticStatus = await checkDidacticModeStatus(settings);
  if (didacticStatus.hasExternalAI) {
    // Add each configured provider
    for (const provider of didacticStatus.configuredProviders) {
      sources.push({
        type: "external",
        provider,
        model: "auto", // Will be determined by mode-aware routing
        isAvailable: true,
      });
    }
  }

  return sources;
}

/**
 * Determine the best strategy for Parallel mode based on available sources
 */
export async function determineParallelStrategy(
  settings: UserSettings,
): Promise<ParallelModeStrategy> {
  const sources = await getAvailableAISources(settings);
  const status = await checkParallelModeStatus(settings);

  // Prefer external as primary if both are available (more powerful)
  // But use local as fallback for privacy
  let primary: AISource;
  let secondary: AISource | undefined;

  if (status.hasExternalAI && status.hasLocalAI) {
    // Both available - use external primary, local secondary
    primary =
      sources.find((s) => s.type === "external") ||
      sources.find((s) => s.type === "local")!;
    secondary = sources.find((s) => s.type === "local");
  } else if (status.hasExternalAI) {
    // Only external available
    primary = sources.find((s) => s.type === "external")!;
  } else if (status.hasLocalAI) {
    // Only local available
    primary = sources.find((s) => s.type === "local")!;
  } else {
    // Fallback (shouldn't happen if validation passed)
    primary = {
      type: "external",
      provider: "auto",
      model: "free",
      isAvailable: false,
    };
  }

  return {
    primary,
    secondary,
    useGlassBox: true, // Always show source transparency
    enableHarmonization: !!secondary, // Only harmonize if we have multiple sources
    conflictResolution: "primary-wins", // Primary source wins on conflicts
  };
}

/**
 * Response source tracking for glass-box transparency
 */
export interface ResponseSource {
  sourceType: "local" | "external" | "harmonized";
  provider: string;
  model: string;
  confidence?: number;
  timestamp: number;
}

/**
 * Create a response source annotation
 */
export function annotateResponseSource(
  content: string,
  source: ResponseSource,
): string {
  // Add invisible metadata that can be used by UI
  // Format: <!--SOURCE:{json}-->content
  const metadata = {
    sourceType: source.sourceType,
    provider: source.provider,
    model: source.model,
    confidence: source.confidence,
    timestamp: source.timestamp,
  };

  return `<!--SOURCE:${JSON.stringify(metadata)}-->${content}`;
}

/**
 * Extract response source from annotated content
 */
export function extractResponseSource(
  content: string,
): { source: ResponseSource | null; cleanContent: string } {
  const sourceMatch = content.match(/<!--SOURCE:(.+?)-->/);

  if (sourceMatch) {
    try {
      const source = JSON.parse(sourceMatch[1]) as ResponseSource;
      const cleanContent = content.replace(/<!--SOURCE:.+?-->/, "").trim();
      return { source, cleanContent };
    } catch (error) {
      logger.error("Failed to parse response source metadata", error);
    }
  }

  return { source: null, cleanContent: content };
}

/**
 * Configuration for Parallel mode's UI
 */
export interface ParallelModeUIConfig {
  showGlassBoxIndicators: boolean;
  showSourceLabels: boolean;
  enableSideBySideComparison: boolean;
  highlightConflicts: boolean;
  themeVariant: "hybrid" | "professional" | "default";
}

export const DEFAULT_PARALLEL_UI_CONFIG: ParallelModeUIConfig = {
  showGlassBoxIndicators: true,
  showSourceLabels: true,
  enableSideBySideComparison: false,
  highlightConflicts: true,
  themeVariant: "hybrid",
};

/**
 * Get Parallel mode UI configuration from mode configuration
 */
export function getParallelModeUIConfig(
  modeConfiguration: Record<string, unknown> | null,
): ParallelModeUIConfig {
  if (!modeConfiguration) {
    return DEFAULT_PARALLEL_UI_CONFIG;
  }

  return {
    showGlassBoxIndicators:
      (modeConfiguration.showGlassBoxIndicators as boolean) ??
      DEFAULT_PARALLEL_UI_CONFIG.showGlassBoxIndicators,
    showSourceLabels:
      (modeConfiguration.showSourceLabels as boolean) ??
      DEFAULT_PARALLEL_UI_CONFIG.showSourceLabels,
    enableSideBySideComparison:
      (modeConfiguration.enableSideBySideComparison as boolean) ??
      DEFAULT_PARALLEL_UI_CONFIG.enableSideBySideComparison,
    highlightConflicts:
      (modeConfiguration.highlightConflicts as boolean) ??
      DEFAULT_PARALLEL_UI_CONFIG.highlightConflicts,
    themeVariant:
      (modeConfiguration.themeVariant as "hybrid" | "professional" | "default") ??
      DEFAULT_PARALLEL_UI_CONFIG.themeVariant,
  };
}
