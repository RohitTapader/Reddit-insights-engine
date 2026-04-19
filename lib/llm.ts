import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function runLLM(prompt: string) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON generator. Return ONLY valid JSON. No explanation, no markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }, // 🔥 ensures JSON output
  });

  return res.choices[0].message.content || "";
}