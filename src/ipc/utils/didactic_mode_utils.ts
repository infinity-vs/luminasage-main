/**
 * Didactic Mode Utilities
 * 
 * This module provides utilities for the Didactic mode, which focuses on
 * external AI orchestration via MCP ecosystem integration with real-time sync.
 */

import log from "electron-log";
import { db } from "../../db";
import { mcpServers } from "../../db/schema";
import type { UserSettings } from "../../lib/schemas";
import { getLanguageModelProviders } from "../shared/language_model_helpers";
import { getEnvVar } from "./read_env";

const logger = log.scope("didactic_mode");

export interface DidacticModeStatus {
  hasExternalAI: boolean;
  availableProviders: string[];
  configuredProviders: string[];
  mcpServersCount: number;
  enabledMcpServersCount: number;
  isReady: boolean;
  issues: string[];
}

/**
 * Check external AI provider availability
 */
async function checkExternalAIProviders(
  settings: UserSettings,
): Promise<{
  available: string[];
  configured: string[];
}> {
  const allProviders = await getLanguageModelProviders();
  const externalProviders = allProviders.filter(
    (p) => p.id !== "ollama" && p.id !== "lmstudio",
  );

  const available: string[] = [];
  const configured: string[] = [];

  for (const provider of externalProviders) {
    // Check if provider has API key configured
    const hasApiKey =
      settings.providerSettings?.[provider.id]?.apiKey?.value ||
      (provider.envVarName && getEnvVar(provider.envVarName));

    if (hasApiKey) {
      configured.push(provider.id);
      available.push(provider.id);
    }
  }

  return { available, configured };
}

/**
 * Check MCP servers status
 */
async function checkMcpServersStatus(): Promise<{
  total: number;
  enabled: number;
}> {
  const servers = await db.select().from(mcpServers);
  const enabled = servers.filter((s) => s.enabled).length;

  return {
    total: servers.length,
    enabled,
  };
}

/**
 * Check if Didactic mode is properly configured and ready to use
 */
export async function checkDidacticModeStatus(
  settings: UserSettings,
): Promise<DidacticModeStatus> {
  const issues: string[] = [];

  // Check external AI providers
  const { available: availableProviders, configured: configuredProviders } =
    await checkExternalAIProviders(settings);

  if (configuredProviders.length === 0) {
    issues.push(
      "No external AI providers configured. Add an API key in Settings.",
    );
  }

  // Check MCP servers
  const { total: mcpServersCount, enabled: enabledMcpServersCount } =
    await checkMcpServersStatus();

  // Didactic mode is ready if there's at least one external AI provider
  const hasExternalAI = configuredProviders.length > 0;
  const isReady = hasExternalAI;

  logger.info(
    `Didactic mode status: External AI=${hasExternalAI}, Providers=${configuredProviders.length}, MCP=${enabledMcpServersCount}/${mcpServersCount}`,
  );

  return {
    hasExternalAI,
    availableProviders,
    configuredProviders,
    mcpServersCount,
    enabledMcpServersCount,
    isReady,
    issues,
  };
}

/**
 * Validate that Didactic mode can be activated
 */
export async function validateDidacticModeRequirements(
  settings: UserSettings,
): Promise<{
  canActivate: boolean;
  reason?: string;
}> {
  const status = await checkDidacticModeStatus(settings);

  if (!status.hasExternalAI) {
    return {
      canActivate: false,
      reason:
        "No external AI providers configured. Please add an API key in Settings (OpenAI, Anthropic, Google, etc.).",
    };
  }

  if (status.issues.length > 0) {
    return {
      canActivate: false,
      reason: status.issues[0],
    };
  }

  return {
    canActivate: true,
  };
}

/**
 * Get recommended external AI provider for Didactic mode
 */
export async function getRecommendedExternalProvider(
  settings: UserSettings,
): Promise<string | null> {
  const { configured } = await checkExternalAIProviders(settings);

  // Priority order for external providers (best for coding)
  const preferredProviders = [
    "anthropic", // Claude Sonnet - excellent for coding
    "openai", // GPT-4 - strong general purpose
    "google", // Gemini - fast and capable
    "xai", // Grok - emerging capability
    "openrouter", // Access to multiple models
    "auto", // Fallback to auto
  ];

  for (const preferred of preferredProviders) {
    if (configured.includes(preferred)) {
      logger.info(`Recommended external provider: ${preferred}`);
      return preferred;
    }
  }

  // If nothing preferred is configured, use first available
  if (configured.length > 0) {
    logger.info(
      `No preferred provider found, using first configured: ${configured[0]}`,
    );
    return configured[0];
  }

  return null;
}

/**
 * Get best external model for the configured provider
 */
export function getBestExternalModel(provider: string): string {
  // Return best model for each provider
  const bestModels: Record<string, string> = {
    anthropic: "claude-sonnet-4-20250514",
    openai: "gpt-4.1",
    google: "gemini-2.5-flash",
    xai: "grok-2-latest",
    openrouter: "anthropic/claude-sonnet-4",
    auto: "free",
    vertex: "gemini-2.0-flash-exp",
    azure: "gpt-4",
    bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  };

  return bestModels[provider] || "auto";
}

/**
 * Configuration for Didactic mode's UI
 */
export interface DidacticModeUIConfig {
  enableRealTimeSync: boolean;
  showExternalProviderStatus: boolean;
  enableMcpIntegration: boolean;
  themeVariant: "professional" | "collaborative" | "default";
}

export const DEFAULT_DIDACTIC_UI_CONFIG: DidacticModeUIConfig = {
  enableRealTimeSync: true,
  showExternalProviderStatus: true,
  enableMcpIntegration: true,
  themeVariant: "professional",
};

/**
 * Get Didactic mode UI configuration from mode configuration
 */
export function getDidacticModeUIConfig(
  modeConfiguration: Record<string, unknown> | null,
): DidacticModeUIConfig {
  if (!modeConfiguration) {
    return DEFAULT_DIDACTIC_UI_CONFIG;
  }

  return {
    enableRealTimeSync:
      (modeConfiguration.enableRealTimeSync as boolean) ??
      DEFAULT_DIDACTIC_UI_CONFIG.enableRealTimeSync,
    showExternalProviderStatus:
      (modeConfiguration.showExternalProviderStatus as boolean) ??
      DEFAULT_DIDACTIC_UI_CONFIG.showExternalProviderStatus,
    enableMcpIntegration:
      (modeConfiguration.enableMcpIntegration as boolean) ??
      DEFAULT_DIDACTIC_UI_CONFIG.enableMcpIntegration,
    themeVariant:
      (modeConfiguration.themeVariant as
        | "professional"
        | "collaborative"
        | "default") ?? DEFAULT_DIDACTIC_UI_CONFIG.themeVariant,
  };
}

/**
 * Check if MCP servers are properly configured for Didactic mode
 */
export async function checkMcpIntegration(): Promise<{
  hasServers: boolean;
  enabledCount: number;
  totalCount: number;
  recommendation?: string;
}> {
  const { total, enabled } = await checkMcpServersStatus();

  let recommendation: string | undefined;

  if (total === 0) {
    recommendation =
      "Consider adding MCP servers for enhanced capabilities (filesystem, web search, etc.).";
  } else if (enabled === 0) {
    recommendation =
      "You have MCP servers configured but none are enabled. Enable them in Settings.";
  }

  return {
    hasServers: total > 0,
    enabledCount: enabled,
    totalCount: total,
    recommendation,
  };
}
