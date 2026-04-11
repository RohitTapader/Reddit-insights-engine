import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query;

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    const error = validateInput(query);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    const posts = await fetchRedditPosts(query);

    const context = posts
      .map((p) => `${p.title} ${p.content}`)
      .join("\n")
      .slice(0, 3000);

    const prompt = `
    Analyze the following user discussions:

    ${context}

    Provide:
    - Top pain points
    - Feature gaps
    - Product opportunities
    `;

    const insights = await runLLM(prompt, "insights");

    return Response.json({
      insights: insights || "No insights generated",
      posts,
    });

  } catch (err: any) {
    console.error("API ERROR:", err);

    return Response.json(
      { error: "Something went wrong in API" },
      { status: 500 }
    );
  }
}