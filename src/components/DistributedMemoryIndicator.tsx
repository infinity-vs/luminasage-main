import { useDistributedMemory } from "@/hooks/useDistributedMemory";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";
import { Database, Radio, Wifi, AlertCircle, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Distributed Memory Indicator
 * 
 * Shows the status of distributed memory systems:
 * - MongoDB connection
 * - Redis event bus
 * - WebSocket sync
 * 
 * Visible in Didactic and Parallel modes (real-time sync enabled)
 */
export function DistributedMemoryIndicator() {
  const { currentMode } = useAICollaborationMode();
  const {
    status,
    isMongoDBConnected,
    isRedisConnected,
    isWebSocketRunning,
    isFullyOperational,
    wsClientCount,
    isLoading,
  } = useDistributedMemory();

  // Only show in modes with real-time sync (didactic and parallel)
  if (currentMode === "inspired") {
    return null;
  }

  if (isLoading || !status) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
        <Radio className="h-3 w-3 animate-pulse" />
        <span>Checking sync status...</span>
      </div>
    );
  }

  // Count connected systems
  const connectedCount = [
    isMongoDBConnected,
    isRedisConnected,
    isWebSocketRunning,
  ].filter(Boolean).length;

  const enabledCount = [
    status.mongodb.enabled,
    status.redis.enabled,
    status.websocket.enabled,
  ].filter(Boolean).length;

  const statusIcon = isFullyOperational ? (
    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
  ) : connectedCount > 0 ? (
    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
  ) : (
    <AlertCircle className="h-3 w-3 text-gray-500 dark:text-gray-400" />
  );

  const statusColor = isFullyOperational
    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
    : connectedCount > 0
      ? "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
      : "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400";

  // Don't show if no systems are enabled
  if (enabledCount === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
            statusColor,
          )}
        >
          <Radio className={cn("h-3 w-3", isFullyOperational && "animate-pulse")} />
          {statusIcon}
          <span className="font-medium">
            {connectedCount}/{enabledCount} Sync
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="font-semibold">Distributed Memory Status</div>
          
          <div className="space-y-1.5">
            {/* MongoDB Status */}
            {status.mongodb.enabled && (
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5" />
                <span className="text-muted-foreground">MongoDB:</span>
                <span className={cn(
                  "font-medium",
                  status.mongodb.connected && status.mongodb.healthy
                    ? "text-green-600"
                    : "text-gray-500"
                )}>
                  {status.mongodb.connected && status.mongodb.healthy
                    ? "✓ Connected"
                    : "✗ Disconnected"}
                </span>
              </div>
            )}
            
            {/* Redis Status */}
            {status.redis.enabled && (
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5" />
                <span className="text-muted-foreground">Redis:</span>
                <span className={cn(
                  "font-medium",
                  status.redis.connected && status.redis.healthy
                    ? "text-green-600"
                    : "text-gray-500"
                )}>
                  {status.redis.connected && status.redis.healthy
                    ? "✓ Connected"
                    : "✗ Disconnected"}
                </span>
              </div>
            )}
            
            {/* WebSocket Status */}
            {status.websocket.enabled && (
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5" />
                <span className="text-muted-foreground">WebSocket:</span>
                <span className={cn(
                  "font-medium",
                  status.websocket.running ? "text-green-600" : "text-gray-500"
                )}>
                  {status.websocket.running
                    ? `✓ Running (${wsClientCount} clients)`
                    : "✗ Offline"}
                </span>
              </div>
            )}
            
            {/* Instance ID */}
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground text-[10px]">Instance:</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {status.instanceId.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
          
          {isFullyOperational ? (
            <div className="text-xs text-muted-foreground mt-1">
              All sync systems operational. Real-time collaboration enabled.
            </div>
          ) : connectedCount > 0 ? (
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Partial sync available. Some systems offline.
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">
              Distributed sync not configured. Working locally.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
