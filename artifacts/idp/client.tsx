import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "@/components/icons";
import { IDPEditor } from "@/components/idp-editor";

type Metadata = Record<string, never>;

export const idpArtifact = new Artifact<"idp", Metadata>({
  kind: "idp",
  description: "Useful for creating and managing Individual Development Plans (IDPs) for employee growth and performance improvement",
  initialize: () => null,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === "data-idpDelta") {
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
      <IDPEditor
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
        toast.success("Copied IDP data to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      description: "Suggest additional actions",
      icon: <SparklesIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Can you suggest additional development actions to strengthen this plan?",
            },
          ],
        });
      },
    },
  ],
});
