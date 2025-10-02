================
CODE SNIPPETS
================
TITLE: Start Development Server with pnpm
DESCRIPTION: Starts the local development server for the Chat SDK. This command typically watches for file changes and enables hot-reloading for a streamlined development workflow. Requires Node.js and pnpm to be installed.

SOURCE: https://chat-sdk.dev/docs/getting-started/setup

LANGUAGE: shell
CODE:
```
pnpm dev
```

--------------------------------

TITLE: Install Dependencies with pnpm
DESCRIPTION: Installs project dependencies using the pnpm package manager. Ensure pnpm is installed globally before running this command. This is a common step in Node.js projects for managing libraries.

SOURCE: https://chat-sdk.dev/docs/getting-started/setup

LANGUAGE: shell
CODE:
```
pnpm install
```

--------------------------------

TITLE: Link Local Project with Vercel CLI
DESCRIPTION: Links a local project directory to a Vercel deployment. This command is part of the Vercel CLI workflow, enabling seamless integration between local development and cloud deployments. Requires the Vercel CLI to be installed and authenticated.

SOURCE: https://chat-sdk.dev/docs/getting-started/setup

LANGUAGE: shell
CODE:
```
vc link
```

--------------------------------

TITLE: Pull Environment Variables with Vercel CLI
DESCRIPTION: Pulls environment variables from a linked Vercel project to the local environment. This is crucial for ensuring consistent configuration between local development and deployed environments. Requires the Vercel CLI and a linked project.

SOURCE: https://chat-sdk.dev/docs/getting-started/setup

LANGUAGE: shell
CODE:
```
vc env pull
```

--------------------------------

TITLE: Server-Side Custom Artifact Example (server.ts)
DESCRIPTION: This server-side code processes the document for a custom artifact. It handles streaming updates and returning the final content. The example demonstrates setting up a document handler and processing incoming data. This example is written in TypeScript.

SOURCE: https://chat-sdk.dev/docs/customization/artifacts

LANGUAGE: typescript
CODE:
```
import {
  type DocumentHandler,
  type DocumentUpdate,
  StreamDispatcher,
} from "@chat-sdk/artifacts/server";

export const customArtifactHandler: DocumentHandler<string, string> = {
  // Handles initialization of the artifact document
  async handleInit(document, streamDispatchers) {
    const streamDispatcher = streamDispatchers.get("custom-artifact") as StreamDispatcher<string>;
    await streamDispatcher.send("Initial artifact data");
    return { content: "Initial content" };
  },

  // Handles updates to the artifact document
  async handleUpdate(
    document,
    update,
    streamDispatchers
  ) {
    const streamDispatcher = streamDispatchers.get("custom-artifact") as StreamDispatcher<string>;

    switch (update.type) {
      case "interaction":
        console.log("Received interaction:", update.data);
        await streamDispatcher.send("Acknowledged interaction");
        return { content: `Received: ${update.data}` };
      default:
        return document;
    }
  },

  // Handles the finalization of the artifact document
  async handleFinalize(document) {
    console.log("Finalizing artifact:", document.content);
    return { content: `Final content: ${document.content}` };
  },
};

```

--------------------------------

TITLE: End-to-End Testing with Playwright in Chat SDK
DESCRIPTION: Demonstrates how to perform end-to-end testing for Chat SDK applications using Playwright. It covers simulating user interactions and validating application responses. The code examples assume the presence of helper classes located in the 'tests/pages' directory.

SOURCE: https://chat-sdk.dev/docs/customization/testing

LANGUAGE: typescript
CODE:
```
import { expect, test } from "@playwright/experimental-ct-react";
import App from "./App";

test.use({
  // You can use defineConfig to configure the CT project
});

test("should render with Vite", async ({ mount }) => {
  const component = await mount(<App />);
  await expect(component).toContainText("Vite");
});
```

--------------------------------

TITLE: Client-Side Custom Artifact Example (client.tsx)
DESCRIPTION: This client-side code is responsible for rendering a custom artifact. It handles initialization, streamed data, and content rendering. The UI can be customized, but the core pattern remains consistent. This example is written in TypeScript/React.

SOURCE: https://chat-sdk.dev/docs/customization/artifacts

LANGUAGE: typescript
CODE:
```
import {
  StreamDispatcher,
  type ArtifactProps,
} from "@chat-sdk/artifacts/client";

export function CustomArtifact({ document, streamDispatchers }: ArtifactProps) {
  const streamDispatcher = streamDispatchers.get("custom-artifact") as StreamDispatcher<string>;

  return (
    <div className="p-4 border rounded-md shadow-sm min-h-[300px]">
      <h2 className="text-xl font-bold mb-2">Custom Artifact</h2>
      <p className="mb-4">Content related to the custom artifact.</p>
      <div className="border p-2 rounded-md bg-gray-50">
        {document.content}
      </div>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => streamDispatcher.send("User interaction data")}
      >
        Send Interaction
      </button>
    </div>
  );
}

```

--------------------------------

TITLE: E2E Testing with Playwright in Chat SDK
DESCRIPTION: This snippet demonstrates how to write End-to-End tests for Chat SDK applications using Playwright. Playwright is used for automating browser interactions and validating application functionality. The example utilizes helper classes to simulate user actions like logging in, creating chats, and sending messages.

SOURCE: https://chat-sdk.dev/docs/concepts/testing

LANGUAGE: typescript
CODE:
```
import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/chat.page';

test.describe('Chat SDK E2E Tests', () => {
  let chatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.login('testuser'); // Assuming a login helper
  });

  test('should create a new chat and send a message', async () => {
    await chatPage.createNewChat();
    await chatPage.sendMessage('Hello, Chat SDK!');
    await expect(chatPage.getLatestMessage()).toContain('Hello, Chat SDK!');
  });

  // More tests can be added here for different functionalities
});

```

--------------------------------

TITLE: Implement Resumable Streams with `experimental_resume` (JavaScript)
DESCRIPTION: This snippet demonstrates how to use the `experimental_resume` function from the `useChat` hook to resume interrupted chat streams. It's called during the initial mount of the chat component and makes a GET request to resume an active stream if available.

SOURCE: https://chat-sdk.dev/docs/customization/resumable-streams

LANGUAGE: javascript
CODE:
```
import { useChat } from '@chatscope/chat-ui-kit-react';

function MyChatComponent({ chatId }) {
  const { experimental_resume } = useChat({
    // ... other useChat options
  });

  useEffect(() => {
    experimental_resume(chatId);
  }, [chatId, experimental_resume]);

  // ... rest of your chat component
  return <div>Chat UI</div>;
}
```

--------------------------------

TITLE: Resumable Streams API
DESCRIPTION: The `experimental_resume` function, returned by the `useChat` hook, enables resuming chat generation streams. It makes a GET request to the chat endpoint with a `chatId` query parameter.

SOURCE: https://chat-sdk.dev/docs/customization/resumable-streams

LANGUAGE: APIDOC
CODE:
```
## GET /api/chat

### Description
This endpoint is used to resume an ongoing chat generation stream. It automatically appends the `chatId` query parameter to identify the chat session. If an active stream exists for the given `chatId`, it will resume from where it left off. Otherwise, the request will complete without error.

### Method
GET

### Endpoint
`/api/chat` (default, can be configured)

### Parameters
#### Query Parameters
- **chatId** (string) - Required - The unique identifier for the chat session to resume.

### Request Example
(No explicit request body for GET request, but the `chatId` is appended as a query parameter)

### Response
#### Success Response (200)
- **stream_id** (string) - The identifier of the resumed stream.
- **message** (string) - The content of the resumed stream.

#### Response Example
```json
{
  "stream_id": "abc123xyz789",
  "message": "This is the resumed message content."
}
```
```

--------------------------------

TITLE: Defining Mock Models for Chat SDK Testing
DESCRIPTION: Illustrates the creation of mock language models for testing purposes within the Chat SDK. This approach simulates language model responses, allowing for the testing of various capabilities like tool calling and artifact generation without actual model interactions. Mock models are defined in 'lib/ai/models.test.ts' and response outputs can be customized in 'tests/prompts/utils.ts'.

SOURCE: https://chat-sdk.dev/docs/customization/testing

LANGUAGE: typescript
CODE:
```
// Example of defining a mock model response in tests/prompts/utils.ts

export const mockChatResponse = (prompt: string) => {
  if (prompt.includes("tool call example")) {
    return {
      tool_calls: [
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "London"}',
          },
        },
      ],
    };
  } else if (prompt.includes("artifact example")) {
    return {
      content: '["artifact content"]',
      // Add other relevant artifact properties
    };
  } else {
    return {
      content: "This is a mock response.",
    };
  }
};

// Example usage within a test file (e.g., lib/ai/models.test.ts)
// Assuming 'TestAIProvider' is a mock provider that uses the above function

// import { TestAIProvider } from './TestAIProvider'; // Hypothetical mock provider
// import { mockChatResponse } from '../prompts/utils';

// test('should handle tool calls with mock models', async () => {
//   const provider = new TestAIProvider({ modelResponse: mockChatResponse });
//   const response = await provider.generateContent('tool call example');
//   expect(response.tool_calls).toBeDefined();
// });

// test('should handle artifacts with mock models', async () => {
//   const provider = new TestAIProvider({ modelResponse: mockChatResponse });
//   const response = await provider.generateContent('artifact example');
//   expect(response.content).toBeDefined();
// });
```

--------------------------------

TITLE: Mock Models for Chat SDK Language Model Testing
DESCRIPTION: This snippet shows how to define mock language models for testing purposes within the Chat SDK. It involves specifying responses for different prompts to simulate language model behavior, which is useful for testing features like tool calling and artifact generation without incurring costs or dealing with non-deterministic outputs.

SOURCE: https://chat-sdk.dev/docs/concepts/testing

LANGUAGE: typescript
CODE:
```
// Example structure within lib/ai/models.test.ts
export const mockModels = {
  'chat-bison-001': {
    predict: async (prompt: string) => {
      if (prompt.includes('tool calling example')) {
        return {
          candidates: [
            {
              content: '{"function_calls": [{"name": "get_weather", "args": {"location": "Paris"}}]}'
            }
          ]
        };
      } else if (prompt.includes('artifact example')) {
        return {
          candidates: [
            {
              content: 'Here is an artifact: [artifact: image_url=http://example.com/image.png]'
            }
          ]
        };
      }
      return {
        candidates: [
          {
            content: 'This is a simulated response for: ' + prompt
          }
        ]
      };
    }
  }
};

// Example usage in tests/prompts/utils.ts or similar
import { mockModels } from '../../lib/ai/models.test';

export const getMockResponse = async (prompt: string) => {
  const model = mockModels['chat-bison-001']; // Or other mock models
  return model.predict(prompt);
};

```

--------------------------------

TITLE: Migration Script for Chat Messages - TypeScript
DESCRIPTION: This TypeScript script is designed to migrate existing chat messages to the new `parts` format. It involves transforming old message structures into the new schema, likely for database backfilling.

SOURCE: https://chat-sdk.dev/docs/migration-guides/message-parts

LANGUAGE: typescript
CODE:
```
import { dbClient } from './db'; // Assuming dbClient is configured
import { Message_v1, Message_v2 } from './types'; // Assuming type definitions

async function migrateMessages() {
  const oldMessages: Message_v1[] = await dbClient.getAllMessages();
  const newMessages: Message_v2[] = [];

  for (const oldMessage of oldMessages) {
    const newMessage: Message_v2 = {
      id: oldMessage.id,
      createdAt: oldMessage.createdAt,
      // Transform content to parts
      parts: [
        {
          type: 'text',
          text: oldMessage.content || ''
        }
        // Add logic here to handle tool invocations and results if they existed in v1
      ],
      // ... other properties
    };
    newMessages.push(newMessage);
  }

  // Bulk insert or update new messages into Message_v2 table
  await dbClient.insertMessagesV2(newMessages);
  console.log('Migration complete.');
}

// Execute the migration
migrateMessages().catch(console.error);

```

--------------------------------

TITLE: Import and Configure Inter Font with Next.js
DESCRIPTION: This snippet demonstrates how to import the Inter font from Google Fonts using `next/font/google`, configure it with a CSS variable name, and prepare it for use in your application. It assumes you are using Next.js.

SOURCE: https://chat-sdk.dev/docs/customization/fonts

LANGUAGE: javascript
CODE:
```
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});
```

--------------------------------

TITLE: Update Custom Provider Configuration in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to update the custom provider configuration for AI models in the Chat SDK. It shows the structure for defining a custom provider named 'myProvider' and specifies model identifiers for different AI functionalities. This allows switching to different AI model providers supported by the AI SDK Gateway.

SOURCE: https://chat-sdk.dev/docs/customization/models-and-providers

LANGUAGE: typescript
CODE:
```
export const myProvider = {
  "chat-model": "grok-1.5-mixtral-8x7b",
  "embedding-model": "text-embedding-3-small",
  "reranker-model": "rerank-lvl2-wikipedia",
};

// Example of updating to use Anthropic's Claude 3.5 Sonnet for chat-model:
// export const myProvider = {
//   "chat-model": "claude-3-5-sonnet",
//   "embedding-model": "text-embedding-3-small",
//   "reranker-model": "rerank-lvl2-wikipedia",
// };
```

--------------------------------

TITLE: Update Message Component for Parts - TypeScript
DESCRIPTION: This snippet demonstrates how to update a React component to use the `parts` property for rendering messages, replacing the older `content` property. It assumes a TypeScript environment and typical chat SDK usage.

SOURCE: https://chat-sdk.dev/docs/migration-guides/message-parts

LANGUAGE: typescript
CODE:
```
import { Message } from '@ai-sdk/react';

// Assuming 'message' is of type Message from the SDK
function MessageComponent({ message }: { message: Message }) {
  return (
    <div>
      {message.parts.map((part, index) => (
        <div key={index}>
          {part.type === 'text' && <span>{part.text}</span>}
          {part.type === 'tool-invocation' && (
            <span>Tool Invoked: {part.toolName}</span>
          )}
          {part.type === 'tool-result' && (
            <span>Tool Result: {JSON.stringify(part.result)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

--------------------------------

TITLE: Update AI Model Identifier in TypeScript
DESCRIPTION: This snippet demonstrates how to update the AI model identifier within the `myProvider` configuration in TypeScript. It shows how to replace the default model with another, such as Anthropic's `claude-3-5-sonnet` for chat functionalities. This requires modifying the specific provider configuration file.

SOURCE: https://chat-sdk.dev/docs/concepts/models-and-providers

LANGUAGE: typescript
CODE:
```
import { chat } from "@ai-sdk/core";

export const myProvider = chat({
  // Replace with your desired model identifier
  model: "claude-3-5-sonnet", 
});

```

--------------------------------

TITLE: Integrate Custom Font Variable into Tailwind CSS Config
DESCRIPTION: This code snippet shows how to add the custom font CSS variable defined in the previous step to your Tailwind CSS configuration file. This allows Tailwind to utilize the new font.

SOURCE: https://chat-sdk.dev/docs/customization/fonts

LANGUAGE: javascript
CODE:
```
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
};
```