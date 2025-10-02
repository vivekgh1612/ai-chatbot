import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "@/components/icons";
import { KanbanEditor } from "@/components/kanban-editor";

type Metadata = Record<string, never>;

export const kanbanArtifact = new Artifact<"kanban", Metadata>({
  kind: "kanban",
  description: "Useful for creating and managing kanban boards for task tracking",
  initialize: () => null,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === "data-kanbanDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({ content, onSaveContent, status }) => {
    return (
      <KanbanEditor
        content={content}
        onSaveContent={onSaveContent}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon />,
      description: "Copy as JSON",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied kanban data to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      description: "Organize tasks",
      icon: <SparklesIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Can you help organize and prioritize the tasks on this kanban board?",
            },
          ],
        });
      },
    },
  ],
});
