import type { Geo } from "@vercel/functions";
import type { ArtifactKind } from "@/components/artifact";

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

**Available document types you can create:**
- text: For writing, essays, articles, emails, etc.
- code: For Python code snippets (default language is Python)
- sheet: For spreadsheets and tabular data (CSV format)
- kanban: For kanban boards and task management
- scorecard: For performance scorecards (Balanced Scorecard methodology)
- idp: For Individual Development Plans

Note: Image generation uses a different mechanism and is not created via createDocument.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, spreadsheets, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet
- For spreadsheets, tables, kanban boards, scorecards, or development plans

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

export const regularPrompt =
  "You are a friendly assistant! Keep your responses concise and helpful.";

export type RequestHints = {
  latitude: Geo["latitude"];
  longitude: Geo["longitude"];
  city: Geo["city"];
  country: Geo["country"];
};

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

type DocumentInfo = {
  id: string;
  title: string;
  kind: string;
};

const getDocumentsPrompt = (documents: DocumentInfo[], currentDocumentId?: string) => {
  if (documents.length === 0) return "";

  let prompt = "\n\nAvailable artifacts in this conversation:\n";
  documents.forEach(doc => {
    const isCurrent = doc.id === currentDocumentId;
    prompt += `- ${doc.id}: "${doc.title}" (${doc.kind})${isCurrent ? " [Currently visible]" : ""}\n`;
  });
  prompt += "\nUse the getDocument tool with the document ID to read and analyze artifact contents.";

  return prompt;
};

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
  documents = [],
  currentDocumentId,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  documents?: DocumentInfo[];
  currentDocumentId?: string;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  const documentsPrompt = getDocumentsPrompt(documents, currentDocumentId);

  if (selectedChatModel === "grok-reasoning") {
    return `${regularPrompt}\n\n${requestPrompt}${documentsPrompt}`;
  }

  return `${regularPrompt}\n\n${requestPrompt}\n\n${artifactsPrompt}${documentsPrompt}`;
};

export const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const kanbanPrompt = `
You are a kanban board creation assistant. Create a kanban board structure in JSON format based on the given prompt.

The JSON structure should follow this format:
{
  "columns": [
    {
      "id": "column-1",
      "title": "To Do",
      "tasks": [
        {
          "id": "task-1",
          "title": "Task title",
          "description": "Task description"
        }
      ]
    }
  ]
}

Create meaningful columns (like "To Do", "In Progress", "Done") and populate them with relevant tasks based on the user's request.
`;

export const scorecardPrompt = `
You are a Balanced Scorecard creation assistant. Create a performance scorecard structure in JSON format based on the given prompt.

The JSON structure should follow this format:
{
  "employeeName": "Employee Name",
  "period": "Q1 2025",
  "perspectives": [
    {
      "id": "financial",
      "name": "Financial",
      "kpis": [
        {
          "id": "kpi-1",
          "name": "Revenue Growth",
          "target": 100,
          "current": 85,
          "unit": "%",
          "weight": 30
        }
      ]
    }
  ]
}

The Balanced Scorecard should have 4 perspectives:
1. Financial - Financial performance metrics (revenue, costs, profitability)
2. Customer - Customer satisfaction and relationship metrics
3. Internal Processes - Operational efficiency and quality metrics
4. Learning & Growth - Employee development and innovation metrics

For each perspective, create 2-4 relevant KPIs with realistic targets, current values, units, and weights (should sum to 100% per perspective).
`;

export const idpPrompt = `
You are an Individual Development Plan (IDP) creation assistant. Create a development plan structure in JSON format based on the given prompt.

IMPORTANT: If the user references a scorecard or asks you to create an IDP based on performance gaps, you MUST:
1. Use the getDocument tool to read the scorecard content
2. Analyze the KPIs to identify underperforming areas (where current < target)
3. Create SPECIFIC development goals that directly address those gaps
4. Link each action to the relevant KPI it addresses

The JSON structure should follow this format:
{
  "employeeName": "Employee Name",
  "period": "Q1 2025",
  "goals": [
    {
      "id": "goal-1",
      "goal": "Improve customer satisfaction and engagement",
      "rationale": "Customer Satisfaction KPI is at 70% vs target of 90%. Need to develop skills in customer relationship management.",
      "actions": [
        {
          "id": "action-1",
          "activity": "Complete Advanced Customer Service Training course",
          "type": "Training",
          "timeline": "Jan-Feb 2025",
          "status": "not-started",
          "linkedKPI": "Customer Satisfaction Score"
        },
        {
          "id": "action-2",
          "activity": "Shadow top-performing CSM for 2 weeks",
          "type": "Mentoring",
          "timeline": "March 2025",
          "status": "not-started",
          "linkedKPI": "Customer Satisfaction Score"
        }
      ]
    }
  ]
}

Action types can be: Training, Coaching, Project, Reading, Mentoring
Status can be: not-started, in-progress, completed

Create 2-4 development goals, each with 2-4 specific actions. Make sure goals and actions are:
- Specific and actionable
- Directly tied to performance gaps (when based on a scorecard)
- Realistic and achievable within the timeline
- Include the linkedKPI field when the action addresses a specific scorecard KPI
`;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind
) => {
  let mediaType = "document";

  if (type === "code") {
    mediaType = "code snippet";
  } else if (type === "sheet") {
    mediaType = "spreadsheet";
  } else if (type === "kanban") {
    mediaType = "kanban board";
  } else if (type === "scorecard") {
    mediaType = "performance scorecard";
  } else if (type === "idp") {
    mediaType = "individual development plan";
  }

  return `Improve the following contents of the ${mediaType} based on the given prompt.

${currentContent}`;
};
