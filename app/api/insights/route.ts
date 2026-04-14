import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";

const cache = new Map<string, any>();

function keywordScore(post: any, query: string) {
  const words = query.toLowerCase().split(" ");
  const text = (post.title + " " + post.content).toLowerCase();

  let score = 0;
  words.forEach((w) => {
    if (post.title.toLowerCase().includes(w)) score += 3;
    if (text.includes(w)) score += 1;
  });

  return score;
}

function engagementScore(post: any) {
  return (post.score || 0) * 0.01 + (post.comments || 0) * 0.02;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    const error = validateInput(query);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    if (cache.has(query)) {
      return Response.json(cache.get(query));
    }

    const posts = await fetchRedditPosts(query);

    const ranked = posts
      .map((p) => ({
        ...p,
        relevance: keywordScore(p, query) + engagementScore(p),
      }))
      .sort((a, b) => b.relevance - a.relevance);

    const topPosts = ranked.slice(0, 8);

    const context = topPosts
      .map((p, i) => `[${i}] ${p.title}\n${p.content}`)
      .join("\n")
      .slice(0, 3000);

    const prompt = `
Analyze Reddit discussions and return product decisions.

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
      "suggested_action": "",
      "confidence_score": 0-1,
      "confidence_reason": "",
      "evidence_post_ids": []
    }
  ],
  "competitors": [
    {
      "name": "",
      "strengths": [],
      "weaknesses": []
    }
  ]
}

Context:
${context}
`;

    const raw = await runLLM(prompt, "insights");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { problems: [], competitors: [] };
    }

    const response = {
      insights: parsed,
      posts: topPosts,
    };

    cache.set(query, response);

    return Response.json(response);

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}