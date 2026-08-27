import OpenAI from "openai";

export type OpenAiCompatibleCredentials = {
  endpoint: string;
  model: string;
  apiKey: string;
};

type ChatMessage = { role: "system" | "user"; content: string };

export type OpenAiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCallHandler = (name: string, argumentsJson: string) => Promise<unknown>;

function extractJson(text: string): unknown {
  const unfenced = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(unfenced); } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("The AI provider did not return valid JSON.");
    return JSON.parse(unfenced.slice(start, end + 1));
  }
}

export async function requestJsonCompletion(
  credentials: OpenAiCompatibleCredentials,
  messages: ChatMessage[],
): Promise<unknown> {
  const client = new OpenAI({
    apiKey: credentials.apiKey || "ollama",
    baseURL: credentials.endpoint.replace(/\/$/, ""),
    timeout: 60000,
    maxRetries: 1,
  });
  const response = await client.chat.completions.create({
    model: credentials.model,
    messages,
    temperature: 0,
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("The AI provider returned an empty response.");
  return extractJson(content);
}

/**
 * Runs one bounded tool-calling turn. The handler stays server-side, so model
 * output can request an operation without receiving credentials or calling
 * Firecrawl directly.
 */
export async function requestJsonWithTools(
  credentials: OpenAiCompatibleCredentials,
  messages: Array<{ role: "system" | "user" | "tool"; content: string; tool_call_id?: string }>,
  tools: OpenAiTool[],
  handleToolCall: ToolCallHandler,
): Promise<unknown> {
  const client = new OpenAI({
    apiKey: credentials.apiKey || "ollama",
    baseURL: credentials.endpoint.replace(/\/$/, ""),
    timeout: 60000,
    maxRetries: 1,
  });
  const conversation = [...messages] as Array<Record<string, unknown>>;

  for (let turn = 0; turn < 3; turn += 1) {
    const response = await client.chat.completions.create({
      model: credentials.model,
      messages: conversation as never,
      temperature: 0,
      tools,
      tool_choice: "auto",
      response_format: { type: "json_object" },
    });
    const message = response.choices[0]?.message;
    if (!message) throw new Error("The AI provider returned an empty response.");
    if (!message.tool_calls?.length) {
      if (!message.content) throw new Error("The AI provider returned an empty response.");
      return extractJson(message.content);
    }
    conversation.push(message as unknown as Record<string, unknown>);
    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      const result = await handleToolCall(call.function.name, call.function.arguments);
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
  throw new Error("The AI provider exceeded the tool-calling limit.");
}
