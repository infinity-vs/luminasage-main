import { useInspiredMode } from "@/hooks/useInspiredMode";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Inspired Mode Indicator
 * 
 * Shows the status of Inspired mode including:
 * - Ollama availability
 * - Available models
 * - Recommended model
 * 
 * Only visible when Inspired mode is active
 */
export function InspiredModeIndicator() {
  const { currentMode } = useAICollaborationMode();
  const {
    isOllamaAvailable,
    availableModels,
    recommendedModel,
    canActivate,
    validationReason,
    isLoading,
  } = useInspiredMode();

  // Only show in inspired mode
  if (currentMode !== "inspired") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
        <Sparkles className="h-3 w-3 animate-pulse" />
        <span>Checking Inspired mode status...</span>
      </div>
    );
  }

  const statusIcon = canActivate ? (
    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
  ) : (
    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
  );

  const statusColor = canActivate
    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
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
          <Sparkles className="h-3 w-3" />
          {statusIcon}
          <span className="font-medium">
            {isOllamaAvailable ? "Ollama Ready" : "Ollama Offline"}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        <div className="flex flex-col gap-2 max-w-xs">
          <div className="font-semibold">Inspired Mode Status</div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Ollama:</span>
              <span className={cn(
                "font-medium",
                isOllamaAvailable ? "text-green-600" : "text-amber-600"
              )}>
                {isOllamaAvailable ? "Available" : "Not Available"}
              </span>
            </div>
            
            {isOllamaAvailable && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Models:</span>
                  <span className="font-medium">{availableModels.length}</span>
                </div>
                
                {recommendedModel && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground whitespace-nowrap">Recommended:</span>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {recommendedModel}
                    </span>
                  </div>
                )}
              </>
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
              All chats in Inspired mode use local Ollama models for complete privacy.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
