export type OpenAiCompatibleCredentials = {
  endpoint: string;
  model: string;
  apiKey: string;
};

type ChatMessage = { role: "system" | "user"; content: string };

function chatCompletionsUrl(endpoint: string) {
  const base = endpoint.replace(/\/$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

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
  const response = await fetch(chatCompletionsUrl(credentials.endpoint), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(credentials.apiKey ? { authorization: `Bearer ${credentials.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: credentials.model, messages, temperature: 0 }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`AI provider returned HTTP ${response.status}${detail ? `: ${detail}` : "."}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI provider returned an empty response.");
  return extractJson(content);
}
