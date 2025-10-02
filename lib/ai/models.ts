export const DEFAULT_CHAT_MODEL: string = "gpt-5";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    description: "OpenAI's most advanced model with superior reasoning",
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Fast and efficient OpenAI model for everyday tasks",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "OpenAI's powerful GPT-4.1 model",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    description: "Efficient GPT-4.1 model for faster responses",
  },
  {
    id: "grok-vision",
    name: "Grok Vision",
    description: "Advanced multimodal model with vision and text capabilities",
  },
  {
    id: "grok-reasoning",
    name: "Grok Reasoning",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
