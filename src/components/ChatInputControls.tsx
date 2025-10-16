import { ContextFilesPicker } from "./ContextFilesPicker";
import { ModelPicker } from "./ModelPicker";
import { ProModeSelector } from "./ProModeSelector";
import { ChatModeSelector } from "./ChatModeSelector";
import { AICollaborationModeSelector } from "./AICollaborationModeSelector";
import { McpToolsPicker } from "@/components/McpToolsPicker";
import { useSettings } from "@/hooks/useSettings";

export function ChatInputControls({
  showContextFilesPicker = false,
}: {
  showContextFilesPicker?: boolean;
}) {
  const { settings } = useSettings();

  return (
    <div className="flex items-center gap-1.5">
      <AICollaborationModeSelector />
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
