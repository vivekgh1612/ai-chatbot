import { streamObject } from "ai";
import { z } from "zod";
import { idpPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const idpDocumentHandler = createDocumentHandler<"idp">({
  kind: "idp",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: idpPrompt,
      prompt: title,
      schema: z.object({
        idp: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { idp } = object;

        if (idp) {
          dataStream.write({
            type: "data-idpDelta",
            data: idp ?? "",
            transient: true,
          });

          draftContent = idp;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: myProvider.languageModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "idp"),
      prompt: description,
      schema: z.object({
        idp: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;
        const { idp } = object;

        if (idp) {
          dataStream.write({
            type: "data-idpDelta",
            data: idp ?? "",
            transient: true,
          });

          draftContent = idp;
        }
      }
    }

    return draftContent;
  },
});
