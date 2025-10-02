import { streamObject } from "ai";
import { z } from "zod";
import { scorecardPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const scorecardDocumentHandler = createDocumentHandler<"scorecard">({
  kind: "scorecard",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: scorecardPrompt,
      prompt: title,
      schema: z.object({
        scorecard: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { scorecard } = object;

        if (scorecard) {
          dataStream.write({
            type: "data-scorecardDelta",
            data: scorecard ?? "",
            transient: true,
          });

          draftContent = scorecard;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "scorecard"),
      prompt: description,
      schema: z.object({
        scorecard: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { scorecard } = object;

        if (scorecard) {
          dataStream.write({
            type: "data-scorecardDelta",
            data: scorecard ?? "",
            transient: true,
          });

          draftContent = scorecard;
        }
      }
    }

    return draftContent;
  },
});
