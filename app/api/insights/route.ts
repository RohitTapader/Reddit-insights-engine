import { classifyCategory } from "@/lib/classifier";
import { getSegmentationStrategy } from "@/lib/segmentation";
import { fetchRedditPosts } from "@/lib/reddit";
import { validatePosts, validateOutput } from "@/lib/validation";
import { generateDecision } from "@/lib/decision";

export async function POST(req: Request) {
  try {
    // -----------------------------
    // 1. PARSE INPUT SAFELY
    // -----------------------------
    let body: { query?: unknown };

    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query || query.length < 3) {
      return Response.json(
        { error: "Query must be at least 3 characters" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. CATEGORY CLASSIFICATION
    // -----------------------------
    const { category } = await classifyCategory(query);

    // -----------------------------
    // 3. SEGMENT STRATEGY
    // -----------------------------
    const segments = getSegmentationStrategy(category);

    // -----------------------------
    // 4. FETCH REDDIT DATA
    // -----------------------------
    let posts = await fetchRedditPosts(query);

    posts = validatePosts(posts);

    // -----------------------------
    // 5. BASIC AGENT LOOP (RETRY)
    // -----------------------------
    if (posts.length < 3) {
      const fallbackQuery = `${query} review experience`;

      let retryPosts = await fetchRedditPosts(fallbackQuery);
      retryPosts = validatePosts(retryPosts);

      if (retryPosts.length > posts.length) {
        posts = retryPosts;
      }
    }

    // -----------------------------
    // 6. FAIL SAFE IF NO DATA
    // -----------------------------
    if (posts.length === 0) {
      return Response.json({
        category,
        segments,
        output: {
          problems: [],
        },
        posts: [],
        message: "No sufficient data found. Try a more specific query.",
      });
    }

    // -----------------------------
    // 7. DECISION ENGINE
    // -----------------------------
    const output = await generateDecision(posts, segments);

    // -----------------------------
    // 8. OUTPUT VALIDATION
    // -----------------------------
    if (!validateOutput(output)) {
      return Response.json(
        { error: "Model output invalid or malformed" },
        { status: 500 }
      );
    }

    // -----------------------------
    // 9. BASIC CONFIDENCE CHECK (AGENT-LIKE)
    // -----------------------------
    const avgConfidence =
      output.problems.reduce(
        (acc: number, p: any) => acc + (p.confidence || 0),
        0
      ) / (output.problems.length || 1);

    // If confidence too low → try one refinement
    if (avgConfidence < 0.4 && posts.length >= 3) {
      const refinedPosts = posts.slice(0, 5); // reduce noise

      const refinedOutput = await generateDecision(
        refinedPosts,
        segments
      );

      if (validateOutput(refinedOutput)) {
        return Response.json({
          category,
          segments,
          output: refinedOutput,
          posts: refinedPosts,
          meta: {
            refinementApplied: true,
            avgConfidence,
          },
        });
      }
    }

    // -----------------------------
    // 10. FINAL RESPONSE
    // -----------------------------
    return Response.json({
      category,
      segments,
      output,
      posts,
      meta: {
        avgConfidence,
        totalPosts: posts.length,
      },
    });

  } catch (err: unknown) {
    console.error("API ERROR:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}