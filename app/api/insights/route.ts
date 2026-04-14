import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";

/* ================= TYPES ================= */

type RedditPost = {
  title: string;
  content: string;
  subreddit: string;
  url: string;
  score: number;
  comments: number;
};

type RankedPost = RedditPost & {
  relevance: number;
};

type Problem = {
  problem: string;
  frequency: string;
  severity: string;
  frequency_reason: string;
  severity_reason: string;
  root_cause: string;
  confidence_score: number;
  confidence_reason: string;
  evidence_post_ids: number[];
};

type InsightsResponse = {
  problems: Problem[];
};

/* ================= CACHE ================= */

const cache = new Map<string, any>();

/* ================= SCORING ================= */

function keywordScore(post: RedditPost, query: string): number {
  const words = query.toLowerCase().split(" ");
  const text = (post.title + " " + post.content).toLowerCase();

  let score = 0;
  words.forEach((w) => {
    if (post.title.toLowerCase().includes(w)) score += 3;
    if (text.includes(w)) score += 1;
  });

  return score;
}

function engagementScore(post: RedditPost): number {
  return (post.score || 0) * 0.01 + (post.comments || 0) * 0.02;
}

/* ================= API ================= */

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    const error = validateInput(query);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    if (cache.has(query)) {
      return Response.json(cache.get(query));
    }

    const posts: RedditPost[] = await fetchRedditPosts(query);

    const ranked: RankedPost[] = posts
      .map((p: RedditPost): RankedPost => ({
        ...p,
        relevance: keywordScore(p, query) + engagementScore(p),
      }))
      .sort((a: RankedPost, b: RankedPost) => b.relevance - a.relevance);

    const topPosts: RankedPost[] = ranked.slice(0, 8);

    const context = topPosts
      .map((p: RankedPost, i: number) => `[${i}] ${p.title}\n${p.content}`)
      .join("\n")
      .slice(0, 3000);

    const prompt = `
Analyze Reddit discussions and extract structured user problems.

Return STRICT JSON:

{
  "problems": [
    {
      "problem": "",
      "frequency": "high|medium|low",
      "severity": "high|medium|low",
      "frequency_reason": "",
      "severity_reason": "",
      "root_cause": "",
      "confidence_score": 0-1,
      "confidence_reason": "",
      "evidence_post_ids": []
    }
  ]
}

Rules:
- Do NOT suggest solutions
- Focus only on user problems
- Be concise
- Use ONLY provided context

Context:
${context}
`;

    const raw = await runLLM(prompt);

    let parsed: InsightsResponse;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { problems: [] };
    }

    parsed = {
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
    };

    const response = {
      insights: parsed,
      posts: topPosts,
    };

    cache.set(query, response);

    return Response.json(response);

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";

    return Response.json({ error: message }, { status: 500 });
  }
}