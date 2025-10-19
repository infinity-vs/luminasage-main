/**
 * Multi-MCP Coordinator
 * 
 * This module coordinates multiple MCP servers for Parallel mode,
 * enabling glass-box transparency and response harmonization.
 */

import log from "electron-log";
import { db } from "../../db";
import { mcpServers } from "../../db/schema";
import { mcpManager } from "./mcp_manager";
import type { experimental_MCPClient } from "ai";

const logger = log.scope("multi_mcp_coordinator");

export interface McpServerInfo {
  id: number;
  name: string;
  enabled: boolean;
  toolCount?: number;
}

export interface McpToolExecution {
  serverId: number;
  serverName: string;
  toolName: string;
  input: unknown;
  output: unknown;
  success: boolean;
  duration: number;
  timestamp: number;
}

export interface McpCoordinatorStatus {
  enabledServers: McpServerInfo[];
  totalTools: number;
  isReady: boolean;
}

/**
 * Multi-MCP Server Coordinator
 */
class MultiMcpCoordinator {
  private static _instance: MultiMcpCoordinator;

  static get instance(): MultiMcpCoordinator {
    if (!this._instance) {
      this._instance = new MultiMcpCoordinator();
    }
    return this._instance;
  }

  private executionHistory: McpToolExecution[] = [];
  private maxHistorySize = 100;

  /**
   * Get all enabled MCP servers with their tool counts
   */
  async getEnabledServers(): Promise<McpServerInfo[]> {
    const servers = await db.select().from(mcpServers);
    const enabledServers = servers.filter((s) => s.enabled);

    const serverInfos: McpServerInfo[] = [];

    for (const server of enabledServers) {
      try {
        const client = await mcpManager.getClient(server.id);
        const tools = await client.tools();
        serverInfos.push({
          id: server.id,
          name: server.name,
          enabled: true,
          toolCount: Object.keys(tools).length,
        });
      } catch (error) {
        logger.error(`Failed to get tools for server ${server.id}`, error);
        serverInfos.push({
          id: server.id,
          name: server.name,
          enabled: true,
          toolCount: 0,
        });
      }
    }

    return serverInfos;
  }

  /**
   * Get coordinator status
   */
  async getStatus(): Promise<McpCoordinatorStatus> {
    const enabledServers = await this.getEnabledServers();
    const totalTools = enabledServers.reduce(
      (sum, s) => sum + (s.toolCount || 0),
      0,
    );

    return {
      enabledServers,
      totalTools,
      isReady: enabledServers.length > 0 && totalTools > 0,
    };
  }

  /**
   * Get all available tools from all enabled MCP servers
   */
  async getAllTools(): Promise<
    Map<
      number,
      { serverName: string; tools: Awaited<ReturnType<experimental_MCPClient["tools"]>> }
    >
  > {
    const serverInfos = await this.getEnabledServers();
    const allTools = new Map<
      number,
      { serverName: string; tools: Awaited<ReturnType<experimental_MCPClient["tools"]>> }
    >();

    for (const serverInfo of serverInfos) {
      try {
        const client = await mcpManager.getClient(serverInfo.id);
        const tools = await client.tools();
        allTools.set(serverInfo.id, {
          serverName: serverInfo.name,
          tools,
        });
      } catch (error) {
        logger.error(`Failed to get tools from server ${serverInfo.id}`, error);
      }
    }

    return allTools;
  }

  /**
   * Execute a tool on a specific MCP server with tracking
   */
  async executeTool(
    serverId: number,
    toolName: string,
    input: unknown,
  ): Promise<{ success: boolean; output: unknown; duration: number }> {
    const startTime = Date.now();
    let success = false;
    let output: unknown = null;

    try {
      const client = await mcpManager.getClient(serverId);
      const result = await client.callTool({
        name: toolName,
        arguments: input as Record<string, unknown>,
      });

      output = result;
      success = true;

      logger.info(`Tool ${toolName} executed successfully on server ${serverId}`);
    } catch (error) {
      logger.error(`Failed to execute tool ${toolName} on server ${serverId}`, error);
      output = error;
      success = false;
    }

    const duration = Date.now() - startTime;

    // Get server name
    const servers = await db.select().from(mcpServers);
    const server = servers.find((s) => s.id === serverId);
    const serverName = server?.name || `Server ${serverId}`;

    // Track execution
    const execution: McpToolExecution = {
      serverId,
      serverName,
      toolName,
      input,
      output,
      success,
      duration,
      timestamp: Date.now(),
    };

    this.addToHistory(execution);

    return { success, output, duration };
  }

  /**
   * Add execution to history
   */
  private addToHistory(execution: McpToolExecution): void {
    this.executionHistory.push(execution);

    // Keep history size limited
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get recent execution history
   */
  getExecutionHistory(limit = 20): McpToolExecution[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    byServer: Map<number, { count: number; successRate: number }>;
  } {
    const totalExecutions = this.executionHistory.length;
    const successCount = this.executionHistory.filter((e) => e.success).length;
    const failureCount = totalExecutions - successCount;

    const avgDuration =
      totalExecutions > 0
        ? this.executionHistory.reduce((sum, e) => sum + e.duration, 0) /
          totalExecutions
        : 0;

    // Statistics by server
    const byServer = new Map<number, { count: number; successRate: number }>();
    for (const execution of this.executionHistory) {
      const existing = byServer.get(execution.serverId) || {
        count: 0,
        successRate: 0,
      };
      existing.count++;
      byServer.set(execution.serverId, existing);
    }

    // Calculate success rates
    for (const [serverId, stats] of byServer.entries()) {
      const serverExecutions = this.executionHistory.filter(
        (e) => e.serverId === serverId,
      );
      const serverSuccesses = serverExecutions.filter((e) => e.success).length;
      stats.successRate = serverSuccesses / serverExecutions.length;
    }

    return {
      totalExecutions,
      successCount,
      failureCount,
      averageDuration: Math.round(avgDuration),
      byServer,
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}

export const multiMcpCoordinator = MultiMcpCoordinator.instance;
