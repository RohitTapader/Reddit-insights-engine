import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";

type Post = {
  title: string;
  content: string;
  subreddit?: string;
  url?: string;
  score?: number;
  comments?: number;
};

export async function POST(req: Request) {
  console.log("STEP 1: API HIT");

  try {
    // -----------------------------
    // Parse Request
    // -----------------------------
    let body: { query?: unknown };

    try {
      const raw = await req.text();
      body = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const query = typeof body.query === "string" ? body.query : undefined;

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    const validationError = validateInput(query);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // -----------------------------
    // Fetch Reddit Data (SAFE)
    // -----------------------------
    let posts: Post[] = [];

    try {
      posts = await fetchRedditPosts(query);
      console.log("STEP 2: Reddit posts fetched:", posts.length);
    } catch (e) {
      console.error("REDDIT ERROR:", e);
      posts = []; // fallback
    }

    // -----------------------------
    // Build Context
    // -----------------------------
    const context = posts
      .map((p) => `${p.title} ${p.content}`)
      .join("\n")
      .slice(0, 3000);

    const prompt = `
Analyze these Reddit discussions about: "${query}"

${context}

Return structured insights:
1. Top user problems
2. Key unmet needs
3. Patterns in complaints

Be concise and specific.
`;

    // -----------------------------
    // Run LLM (SAFE)
    // -----------------------------
    let insights = "LLM temporarily unavailable";

    try {
      insights = await runLLM(prompt);
      console.log("STEP 3: LLM success");
    } catch (e) {
      console.error("LLM ERROR:", e);
    }

    // -----------------------------
    // Final Response
    // -----------------------------
    return Response.json({
      success: true,
      insights,
      posts,
    });

  } catch (err: unknown) {
    console.error("API CRASH:", err);

    if (err instanceof Error) {
      return Response.json({ error: err.message }, { status: 500 });
    }

    const message =
      err instanceof Error ? err.message : "Unexpected server error";

    return Response.json({ error: message }, { status: 500 });
  }
}