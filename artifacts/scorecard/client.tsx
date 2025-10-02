import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "@/components/icons";
import { ScorecardEditor } from "@/components/scorecard-editor";

type Metadata = Record<string, never>;

export const scorecardArtifact = new Artifact<"scorecard", Metadata>({
  kind: "scorecard",
  description: "Useful for creating and managing employee performance scorecards based on Balanced Scorecard methodology",
  initialize: () => null,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === "data-scorecardDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({ content, onSaveContent, status, isInline }) => {
    return (
      <ScorecardEditor
        content={content}
        onSaveContent={onSaveContent}
        status={status}
        isInline={isInline}
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
        toast.success("Copied scorecard data to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      description: "Suggest improvements",
      icon: <SparklesIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Can you suggest improvements or adjustments to this scorecard to better align with performance goals?",
            },
          ],
        });
      },
    },
  ],
});
