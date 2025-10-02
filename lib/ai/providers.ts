import { gateway } from "@ai-sdk/gateway";
import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "gpt-5": openai("gpt-5"),
        "gpt-5-mini": openai("gpt-5-mini"),
        "gpt-4.1": openai("gpt-4.1"),
        "gpt-4.1-mini": openai("gpt-4.1-mini"),
        "grok-vision": gateway.languageModel("xai/grok-2-vision-1212"),
        "grok-reasoning": wrapLanguageModel({
          model: gateway.languageModel("xai/grok-3-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": openai("gpt-5-mini"),
        "artifact-model": openai("gpt-5-mini"),
      },
    });
