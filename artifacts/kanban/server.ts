import { streamObject } from "ai";
import { z } from "zod";
import { kanbanPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const kanbanDocumentHandler = createDocumentHandler<"kanban">({
  kind: "kanban",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: kanbanPrompt,
      prompt: title,
      schema: z.object({
        kanban: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { kanban } = object;

        if (kanban) {
          dataStream.write({
            type: "data-kanbanDelta",
            data: kanban ?? "",
            transient: true,
          });

          draftContent = kanban;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "kanban"),
      prompt: description,
      schema: z.object({
        kanban: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { kanban } = object;

        if (kanban) {
          dataStream.write({
            type: "data-kanbanDelta",
            data: kanban ?? "",
            transient: true,
          });

          draftContent = kanban;
        }
      }
    }

    return draftContent;
  },
});
