import { runLLM } from "./llm";

export async function classifySegments(posts: any[], segments: string[]) {
  const context = posts
    .map((p, i) => `[${i}] ${p.title} ${p.content}`)
    .join("\n");

  const prompt = `
Classify each post into one of these segments:
${segments.join(", ")}

Return JSON:
[
  { "id": 0, "segment": "" }
]

${context}
`;

  const res = await runLLM(prompt);

  try {
    return JSON.parse(res);
  } catch {
    return [];
  }
}