import { ContextFilesPicker } from "./ContextFilesPicker";
import { ModelPicker } from "./ModelPicker";
import { ProModeSelector } from "./ProModeSelector";
import { ChatModeSelector } from "./ChatModeSelector";
import { AICollaborationModeSelector } from "./AICollaborationModeSelector";
import { InspiredModeIndicator } from "./InspiredModeIndicator";
import { DidacticModeIndicator } from "./DidacticModeIndicator";
import { ParallelModeIndicator } from "./ParallelModeIndicator";
import { McpToolsPicker } from "@/components/McpToolsPicker";
import { useSettings } from "@/hooks/useSettings";
import { useAICollaborationMode } from "@/hooks/useAICollaborationMode";

export function ChatInputControls({
  showContextFilesPicker = false,
}: {
  showContextFilesPicker?: boolean;
}) {
  const { settings } = useSettings();
  const { currentMode } = useAICollaborationMode();

  return (
    <div className="flex items-center gap-1.5">
      <AICollaborationModeSelector />
      {currentMode === "inspired" && (
        <>
          <InspiredModeIndicator />
          <div className="w-1"></div>
        </>
      )}
      {currentMode === "didactic" && (
        <>
          <DidacticModeIndicator />
          <div className="w-1"></div>
        </>
      )}
      {currentMode === "parallel" && (
        <>
          <ParallelModeIndicator />
          <div className="w-1"></div>
        </>
      )}
      <ChatModeSelector />
      {settings?.selectedChatMode === "agent" && (
        <>
          <div className="w-1"></div>
          <McpToolsPicker />
        </>
      )}
      <div className="w-1"></div>
      <ModelPicker />
      <div className="w-1"></div>
      <ProModeSelector />
      {showContextFilesPicker && (
        <>
          <div className="w-1"></div>
          <ContextFilesPicker />
        </>
      )}
    </div>
  );
}
