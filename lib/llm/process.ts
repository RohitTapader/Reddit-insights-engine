import { getMaxTokens } from "./tokens";

export async function runLLM(prompt: string, intent: string) {
  const maxTokens = getMaxTokens(intent);

  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
          Use ONLY provided data.
          Be concise and structured.
          Avoid hallucination.
          No unsafe content.
          `,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI returned non-JSON (HTTP ${res.status}).`);
  }

  const errMsg = (data as { error?: { message?: string } })?.error?.message;
  if (!res.ok) {
    throw new Error(errMsg ?? `OpenAI HTTP ${res.status}`);
  }

  const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]
    ?.message?.content;
  if (content == null || content === "") {
    throw new Error("OpenAI returned no message content.");
  }

  return content;
}