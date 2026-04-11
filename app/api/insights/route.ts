import { fetchRedditPosts } from "@/lib/mcp/reddit";
import { validateInput } from "@/lib/validators/input";
import { runLLM } from "@/lib/llm/process";


const cache = new Map<string, any>();
/* ================= INTENT CLASSIFICATION ================= */

async function classifyIntent(query: string) {
  const prompt = `
Classify the intent of this query into one of:
- pricing
- feature_feedback
- bugs/issues
- comparison
- general

Query: ${query}

Return only the label.
`;

  try {
    const result = await runLLM(prompt, "ask");
    return result.trim().toLowerCase();
  } catch {
    return "general";
  }
}

/* ================= RELEVANCE SCORING ================= */

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

/* ================= SEMANTIC BOOST (LLM-lite) ================= */

async function semanticBoost(post: any, query: string) {
  const prompt = `
Is this Reddit post relevant to the query?

Query: ${query}
Post: ${post.title}

Answer only YES or NO.
`;

  try {
    const result = await runLLM(prompt, "ask");
    return result.toLowerCase().includes("yes") ? 5 : 0;
  } catch {
    return 0;
  }
}

/* ================= DEDUPLICATION ================= */

function deduplicate(posts: any[]) {
  const seen = new Set();
  return posts.filter((p) => {
    const key = p.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ================= DIVERSITY ================= */

function diversify(posts: any[]) {
  const seenSubs = new Set();

  return posts.filter((p) => {
    if (seenSubs.has(p.subreddit)) return false;
    seenSubs.add(p.subreddit);
    return true;
  });
}

/* ================= MAIN API ================= */

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

    /* ===== INTENT ===== */
    const intent = await classifyIntent(query);

    /* ===== FETCH POSTS ===== */
    const posts = await fetchRedditPosts(query);

    /* ===== SCORING ===== */
    const scoredPosts = await Promise.all(
      posts.map(async (post) => {
        const score =
          keywordScore(post, query) +
          engagementScore(post) +
          (await semanticBoost(post, query));

        return { ...post, relevance: score };
      })
    );

    /* ===== SORT ===== */
    let ranked = scoredPosts.sort((a, b) => b.relevance - a.relevance);

    /* ===== DEDUP ===== */
    ranked = deduplicate(ranked);

    /* ===== DIVERSIFY ===== */
    ranked = diversify(ranked);

    /* ===== LIMIT ===== */
    ranked = ranked.slice(0, 5);

    /* ===== CONTEXT ===== */
    const context = ranked
      .map((p) => `${p.title}\n${p.content}`)
      .join("\n")
      .slice(0, 3000);

    /* ===== INSIGHTS PROMPT ===== */
    const prompt = `
Analyze the following Reddit discussions:

${context}

Intent: ${intent}

Return STRICT JSON:

{
  "pain_points": [],
  "opportunities": []
}

Rules:
- No duplication between sections
- Keep concise
- Max 5 each
`;

    const raw = await runLLM(prompt, "insights");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { pain_points: [], opportunities: [] };
    }

    const response = {
      insights: parsed,
      posts: ranked,
      intent,
    };

    cache.set(query, response);
    return Response.json(response);

  } catch (err: any) {
    console.error("API ERROR:", err);

    return Response.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}