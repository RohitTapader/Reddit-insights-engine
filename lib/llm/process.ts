import { getMaxTokens } from "./tokens";

export async function runLLM(prompt: string, intent: string) {
  const maxTokens = getMaxTokens(intent);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

  const data = await res.json();

  return data.choices[0].message.content;
}