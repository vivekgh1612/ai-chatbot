import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getDocument } from "./ai/tools/get-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type getDocumentTool = InferUITool<ReturnType<typeof getDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  getDocument: getDocumentTool;
  requestSuggestions: requestSuggestionsTool;
};

export type ScorecardSuggestion = {
  id: string;
  documentId: string;
  type: "add-kpi" | "adjust-target" | "adjust-weight" | "rebalance-weights" | "general";
  description: string;
  rationale: string;
  change: {
    perspectiveId?: string;
    kpiId?: string;
    field?: string;
    value?: string | number;
    newKpi?: {
      name: string;
      target: number;
      current: number;
      unit: string;
      weight: number;
    };
  };
  isResolved: boolean;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  kanbanDelta: string;
  scorecardDelta: string;
  idpDelta: string;
  suggestion: Suggestion;
  scorecardSuggestion: ScorecardSuggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
