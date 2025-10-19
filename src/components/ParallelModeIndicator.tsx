import { useParallelMode } from "@/hooks/useParallelMode";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";
import { Zap, AlertCircle, CheckCircle, Layers, Server } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Parallel Mode Indicator
 * 
 * Shows the status of Parallel mode including:
 * - Local and External AI availability (glass-box transparency)
 * - Primary and secondary AI sources
 * - Multi-MCP coordinator status
 * - Strategy information
 * 
 * Only visible when Parallel mode is active
 */
export function ParallelModeIndicator() {
  const { currentMode } = useAICollaborationMode();
  const {
    hasLocalAI,
    hasExternalAI,
    localModels,
    externalProviders,
    canActivate,
    validationReason,
    primarySource,
    secondarySource,
    hasMultipleSources,
    totalMcpTools,
    isLoading,
  } = useParallelMode();

  // Only show in parallel mode
  if (currentMode !== "parallel") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>Checking Parallel mode status...</span>
      </div>
    );
  }

  const statusIcon = canActivate ? (
    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
  ) : (
    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
  );

  const statusColor = canActivate
    ? "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
    : "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300";

  // Count total AI sources
  const totalSources = (hasLocalAI ? 1 : 0) + (hasExternalAI ? 1 : 0);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
            statusColor,
          )}
        >
          <Zap className="h-3 w-3" />
          {statusIcon}
          <span className="font-medium">
            {totalSources > 0 ? `${totalSources} AI Sources` : "No AI Sources"}
          </span>
          {hasMultipleSources && (
            <Layers className="h-3 w-3 ml-0.5" />
          )}
          {totalMcpTools > 0 && (
            <Server className="h-3 w-3 ml-0.5" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="font-semibold flex items-center gap-1.5">
            Parallel Mode Status
            <Layers className="h-3.5 w-3.5 text-amber-600" />
          </div>
          
          <div className="space-y-1.5">
            {/* Local AI Status */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Local AI:</span>
              <span className={cn(
                "font-medium",
                hasLocalAI ? "text-green-600" : "text-gray-500"
              )}>
                {hasLocalAI ? `✓ ${localModels} models` : "✗ Not available"}
              </span>
            </div>
            
            {/* External AI Status */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">External AI:</span>
              <span className={cn(
                "font-medium",
                hasExternalAI ? "text-green-600" : "text-gray-500"
              )}>
                {hasExternalAI ? `✓ ${externalProviders} providers` : "✗ Not configured"}
              </span>
            </div>

            {/* Glass-box transparency: Show sources */}
            {canActivate && primarySource && (
              <>
                <div className="mt-2 pt-2 border-t border-border">
                  <div className="text-xs font-semibold mb-1">AI Sources (Glass-box):</div>
                  
                  {/* Primary source */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Primary
                    </span>
                    <span className="font-mono text-[10px]">
                      {primarySource.type === "local" ? "🏠" : "☁️"} {primarySource.provider}
                    </span>
                  </div>
                  
                  {/* Secondary source */}
                  {secondarySource && (
                    <div className="flex items-center gap-1.5 text-xs mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Secondary
                      </span>
                      <span className="font-mono text-[10px]">
                        {secondarySource.type === "local" ? "🏠" : "☁️"} {secondarySource.provider}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MCP Tools */}
            {totalMcpTools > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">MCP Tools:</span>
                <span className="font-medium">{totalMcpTools} available</span>
              </div>
            )}
            
            {!canActivate && validationReason && (
              <div className="mt-2 pt-2 border-t border-border">
                <span className="text-amber-600 dark:text-amber-400 text-xs">
                  {validationReason}
                </span>
              </div>
            )}
          </div>
          
          {canActivate && (
            <div className="text-xs text-muted-foreground mt-1">
              Parallel mode coordinates multiple AI sources with transparent origin tracking.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
