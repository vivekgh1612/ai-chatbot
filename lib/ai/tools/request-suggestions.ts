import { streamObject, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { myProvider } from "../providers";

type RequestSuggestionsProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description: "Request suggestions for a document",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe("The ID of the document to request edits"),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: "Document not found",
        };
      }

      // Check if this is a text document (use inline suggestions) or structured document (use commentary)
      const isTextDocument = document.kind === "text";

      if (isTextDocument) {
        // Original behavior for text documents - inline sentence-level suggestions
        const suggestions: Omit<
          Suggestion,
          "userId" | "createdAt" | "documentCreatedAt"
        >[] = [];

        const { elementStream } = streamObject({
          model: myProvider.languageModel("artifact-model"),
          system:
            "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.",
          prompt: document.content,
          output: "array",
          schema: z.object({
            originalSentence: z.string().describe("The original sentence"),
            suggestedSentence: z.string().describe("The suggested sentence"),
            description: z.string().describe("The description of the suggestion"),
          }),
        });

        for await (const element of elementStream) {
          // @ts-expect-error todo: fix type
          const suggestion: Suggestion = {
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
            description: element.description,
            id: generateUUID(),
            documentId,
            isResolved: false,
          };

          dataStream.write({
            type: "data-suggestion",
            data: suggestion,
            transient: true,
          });

          suggestions.push(suggestion);
        }

        if (session.user?.id) {
          const userId = session.user.id;

          await saveSuggestions({
            suggestions: suggestions.map((suggestion) => ({
              ...suggestion,
              userId,
              createdAt: new Date(),
              documentCreatedAt: document.createdAt,
            })),
          });
        }

        return {
          id: documentId,
          title: document.title,
          kind: document.kind,
          message: "Suggestions have been added to the document",
        };
      } else {
        // For structured documents (scorecard, kanban, IDP, sheet, code) - return improvement commentary
        const { elementStream } = streamObject({
          model: myProvider.languageModel("artifact-model"),
          system: `You are a helpful assistant analyzing ${document.kind} documents. Provide strategic improvement suggestions based on the content. Focus on high-level recommendations, best practices, and potential enhancements. Max 5 suggestions.`,
          prompt: `Analyze this ${document.kind} and provide improvement suggestions:\n\n${document.content}`,
          output: "array",
          schema: z.object({
            suggestion: z.string().describe("The improvement suggestion"),
            rationale: z.string().describe("Why this improvement would be beneficial"),
          }),
        });

        const improvementSuggestions: string[] = [];

        for await (const element of elementStream) {
          const formattedSuggestion = `**${element.suggestion}**\n${element.rationale}`;
          improvementSuggestions.push(formattedSuggestion);
        }

        // Return the suggestions as a formatted message to be displayed in chat
        const suggestionsText = improvementSuggestions.map((s, i) => `${i + 1}. ${s}`).join("\n\n");

        return {
          id: documentId,
          title: document.title,
          kind: document.kind,
          message: `Here are improvement suggestions for your ${document.kind}:\n\n${suggestionsText}`,
        };
      }
    },
  });
