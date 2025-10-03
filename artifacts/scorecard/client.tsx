import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  GraduationCapIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "@/components/icons";
import { ScorecardEditor } from "@/components/scorecard-editor";
import type { ScorecardSuggestion } from "@/lib/types";

type Metadata = {
  suggestions: ScorecardSuggestion[];
};

export const scorecardArtifact = new Artifact<"scorecard", Metadata>({
  kind: "scorecard",
  description: "Useful for creating and managing employee performance scorecards based on Balanced Scorecard methodology",
  initialize: () => ({ suggestions: [] }),
  onStreamPart: ({ setArtifact, streamPart, setMetadata }) => {
    if (streamPart.type === "data-scorecardDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }

    if (streamPart.type === "data-scorecardSuggestion") {
      setMetadata((metadata) => {
        return {
          suggestions: [...(metadata?.suggestions || []), streamPart.data],
        };
      });
    }
  },
  content: ({ content, onSaveContent, status, isInline, metadata }) => {
    return (
      <ScorecardEditor
        key={`scorecard-${metadata?.suggestions.length || 0}`}
        content={content}
        onSaveContent={onSaveContent}
        status={status}
        isInline={isInline}
        suggestions={metadata ? metadata.suggestions : []}
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
      description: "Create Development Plan",
      icon: <GraduationCapIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Based on the performance gaps in this scorecard, create an Individual Development Plan (IDP) to help me improve in underperforming areas.",
            },
          ],
        });
      },
    },
    {
      description: "Suggest improvements",
      icon: <SparklesIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Suggest improvements for this scorecard.",
            },
          ],
        });
      },
    },
  ],
});
