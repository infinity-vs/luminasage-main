import {
  MiniSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";
import { useInspiredMode } from "@/hooks/useInspiredMode";
import { useDidacticMode } from "@/hooks/useDidacticMode";
import type { AICollaborationMode } from "@/ipc/ipc_types";
import { cn } from "@/lib/utils";
import { Sparkles, BookOpen, Zap, AlertCircle } from "lucide-react";
import { showError } from "@/lib/toast";

export function AICollaborationModeSelector() {
  const { currentMode, availableModes, switchMode, isSwitching } =
    useAICollaborationMode();
  const { canActivate: canActivateInspired, validationReason: inspiredReason } =
    useInspiredMode();
  const { canActivate: canActivateDidactic, validationReason: didacticReason } =
    useDidacticMode();

  const handleModeChange = async (value: string) => {
    const targetMode = value as AICollaborationMode;

    // Validate Inspired mode before switching
    if (targetMode === "inspired" && !canActivateInspired) {
      showError(
        new Error(
          inspiredReason ||
            "Cannot activate Inspired mode. Please ensure Ollama is running and has models installed.",
        ),
      );
      return;
    }

    // Validate Didactic mode before switching
    if (targetMode === "didactic" && !canActivateDidactic) {
      showError(
        new Error(
          didacticReason ||
            "Cannot activate Didactic mode. Please configure an external AI provider in Settings.",
        ),
      );
      return;
    }

    try {
      await switchMode(targetMode);
    } catch (error) {
      // Error is handled by the hook
      console.error("Failed to switch mode:", error);
    }
  };

  const getModeDisplayName = (mode: AICollaborationMode) => {
    switch (mode) {
      case "inspired":
        return "Inspired";
      case "didactic":
        return "Didactic";
      case "parallel":
        return "Parallel";
      default:
        return "Inspired";
    }
  };

  const getModeIcon = (mode: AICollaborationMode) => {
    switch (mode) {
      case "inspired":
        return <Sparkles className="h-3 w-3" />;
      case "didactic":
        return <BookOpen className="h-3 w-3" />;
      case "parallel":
        return <Zap className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getModeDescription = (mode: AICollaborationMode) => {
    switch (mode) {
      case "inspired":
        return "Local Ollama models with contemplative UI";
      case "didactic":
        return "External AI via Perplexity MCP orchestration";
      case "parallel":
        return "Hybrid local + external coordination";
      default:
        return "";
    }
  };

  const getModeCapabilityBadges = (mode: AICollaborationMode) => {
    const modeStatus = availableModes.find((m) => m.mode === mode);
    if (!modeStatus) return null;

    const badges: string[] = [];
    if (modeStatus.capabilities.localAI) badges.push("Local");
    if (modeStatus.capabilities.externalAI) badges.push("External");
    if (modeStatus.capabilities.offlineCapable) badges.push("Offline");
    if (modeStatus.capabilities.multiChannel) badges.push("Multi-channel");

    return badges;
  };

  return (
    <Select
      value={currentMode}
      onValueChange={handleModeChange}
      disabled={isSwitching}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <MiniSelectTrigger
            data-testid="ai-collaboration-mode-selector"
            className={cn(
              "h-6 w-fit px-2 py-0 text-xs-sm font-medium shadow-none gap-1",
              currentMode === "inspired"
                ? "bg-purple-100 hover:bg-purple-200 focus:bg-purple-200 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/40 dark:text-purple-300"
                : currentMode === "didactic"
                  ? "bg-blue-100 hover:bg-blue-200 focus:bg-blue-200 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/40 dark:text-blue-300"
                  : "bg-amber-100 hover:bg-amber-200 focus:bg-amber-200 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-900/40 dark:text-amber-300",
              isSwitching && "opacity-50 cursor-not-allowed",
            )}
            size="sm"
          >
            {getModeIcon(currentMode)}
            <SelectValue>{getModeDisplayName(currentMode)}</SelectValue>
          </MiniSelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col">
            <span className="font-medium">AI Collaboration Mode</span>
            <span className="text-xs text-muted-foreground">
              {getModeDescription(currentMode)}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
      <SelectContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
        <SelectItem value="inspired" disabled={!canActivateInspired}>
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium">Inspired</span>
              {!canActivateInspired && (
                <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {getModeDescription("inspired")}
            </span>
            {!canActivateInspired && inspiredReason && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                {inspiredReason}
              </span>
            )}
            <div className="flex gap-1 mt-1">
              {getModeCapabilityBadges("inspired")?.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </SelectItem>
        <SelectItem value="didactic" disabled={!canActivateDidactic}>
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Didactic</span>
              {!canActivateDidactic && (
                <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {getModeDescription("didactic")}
            </span>
            {!canActivateDidactic && didacticReason && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                {didacticReason}
              </span>
            )}
            <div className="flex gap-1 mt-1">
              {getModeCapabilityBadges("didactic")?.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </SelectItem>
        <SelectItem value="parallel">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">Parallel</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {getModeDescription("parallel")}
            </span>
            <div className="flex gap-1 mt-1">
              {getModeCapabilityBadges("parallel")?.map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
