import { fetchRedditPosts } from "@/lib/reddit";
import { runLLM } from "@/lib/llm";

/** ---- TYPES ---- */

type RedditPost = {
  title: string;
  content: string;
  url: string;
  created: number;
};

type Problem = {
  problem: string;
  segment: string;
  confidence: number;
  reason: string;
  evidence_ids: number[];
};

type LLMOutput = {
  problems: Problem[];
};

/** ---- SIMPLE CLASSIFIER (TEMP) ---- */

function classifyCategory(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("diaper") || q.includes("baby")) return "baby";
  if (q.includes("phone") || q.includes("iphone")) return "electronics";
  if (q.includes("shoe") || q.includes("nike")) return "fashion";

  return "general";
}

/** ---- SEGMENTATION ---- */

function segmentUsers(category: string): string[] {
  switch (category) {
    case "baby":
      return ["budget-conscious parents", "premium parents"];
    case "electronics":
      return ["power users", "casual users"];
    case "fashion":
      return ["style-focused", "budget buyers"];
    default:
      return ["general users"];
  }
}

/** ---- MAIN API ---- */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing query" }),
        { status: 400 }
      );
    }

    /** 1. Fetch posts */
    const posts: RedditPost[] = await fetchRedditPosts(query);

    /** 2. Prepare context */
    const context = posts
      .map((p) => `${p.title}. ${p.content}`)
      .join("\n")
      .slice(0, 3000);

    /** 3. Classification */
    const category = classifyCategory(query);
    const segments = segmentUsers(category);

    /** 4. LLM prompt */
    const prompt = `
You are a product intelligence system.

Analyze real user discussions and extract decision-ready insights.

Return STRICT JSON:

{
  "problems": [
    {
      "problem": "string",
      "segment": "string",
      "confidence": 0-1,
      "reason": "string",
      "evidence_ids": [0,1]
    }
  ]
}

User query: ${query}
Category: ${category}
Segments: ${segments.join(", ")}

Posts:
${context}
`;

    /** 5. LLM call */
    const raw = await runLLM(prompt);

    let output: LLMOutput;

    try {
      output = JSON.parse(raw);
    } catch {
      console.error("LLM RAW OUTPUT:", raw);
      throw new Error("LLM returned invalid JSON");
    }

    /** 6. Confidence */
    const avgConfidence =
      output.problems.reduce((sum, p) => sum + p.confidence, 0) /
      (output.problems.length || 1);

    /** 7. RESPONSE */
    return new Response(
      JSON.stringify({
        category,
        segments,
        output,
        posts,
        meta: {
          avgConfidence,
          totalPosts: posts.length,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    console.error("API ERROR:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}