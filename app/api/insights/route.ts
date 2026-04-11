import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";

export async function POST(req: Request) {
  const { query } = await req.json();

  const error = validateInput(query);
  if (error) return Response.json({ error });

  const posts = await fetchRedditPosts(query);

  const context = posts.map(p => `${p.title} ${p.content}`).join("\n").slice(0, 4000);

  const prompt = `
  Analyze:
  ${context}

  Provide:
  - Top user pain points
  - Feature gaps
  - Product opportunities
  `;

  const insights = await runLLM(prompt, "insights");

  return Response.json({ insights, posts });
}