import { useDidacticMode } from "@/hooks/useDidacticMode";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";
import { BookOpen, AlertCircle, CheckCircle, Plug } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Didactic Mode Indicator
 * 
 * Shows the status of Didactic mode including:
 * - External AI provider availability
 * - Configured providers
 * - MCP server integration status
 * 
 * Only visible when Didactic mode is active
 */
export function DidacticModeIndicator() {
  const { currentMode } = useAICollaborationMode();
  const {
    hasExternalAI,
    configuredProviders,
    mcpServersEnabled,
    mcpServersTotal,
    canActivate,
    validationReason,
    isLoading,
  } = useDidacticMode();

  // Only show in didactic mode
  if (currentMode !== "didactic") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
        <BookOpen className="h-3 w-3 animate-pulse" />
        <span>Checking Didactic mode status...</span>
      </div>
    );
  }

  const statusIcon = canActivate ? (
    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
  ) : (
    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
  );

  const statusColor = canActivate
    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
    : "bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors",
            statusColor,
          )}
        >
          <BookOpen className="h-3 w-3" />
          {statusIcon}
          <span className="font-medium">
            {hasExternalAI ? "External AI Ready" : "No External AI"}
          </span>
          {mcpServersEnabled > 0 && (
            <Plug className="h-3 w-3 ml-0.5" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="font-semibold">Didactic Mode Status</div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">External AI:</span>
              <span className={cn(
                "font-medium",
                hasExternalAI ? "text-green-600" : "text-amber-600"
              )}>
                {hasExternalAI ? "Available" : "Not Configured"}
              </span>
            </div>
            
            {hasExternalAI && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Providers:</span>
                  <span className="font-medium">{configuredProviders.length}</span>
                </div>
                
                {configuredProviders.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {configuredProviders.map((provider) => (
                      <span
                        key={provider}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 capitalize"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">MCP Servers:</span>
              <span className="font-medium">
                {mcpServersEnabled} / {mcpServersTotal} enabled
              </span>
            </div>
            
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
              Didactic mode uses external AI services with optional MCP integration for enhanced capabilities.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
