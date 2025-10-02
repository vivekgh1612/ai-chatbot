import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById } from "@/lib/db/queries";

type GetDocumentProps = {
  session: Session;
};

export const getDocument = ({ session }: GetDocumentProps) =>
  tool({
    description: "Retrieve and read the current content of a document/artifact to answer questions about it. Use this when you need to query, analyze, or list information from an existing artifact.",
    inputSchema: z.object({
      id: z.string().describe("The ID of the document to retrieve"),
    }),
    execute: async ({ id }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: "Document not found",
        };
      }

      return {
        id: document.id,
        title: document.title,
        kind: document.kind,
        content: document.content,
      };
    },
  });
