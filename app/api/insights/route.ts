import { runLLM } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query = body?.query;
    const posts = body?.posts || [];

    if (!query) {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
      });
    }

    if (!posts.length) {
      return new Response(
        JSON.stringify({ error: "No data received from client" }),
        { status: 400 }
      );
    }

    const context = posts
      .map((p: any, i: number) => `[${i}] ${p.title} ${p.content}`)
      .join("\n")
      .slice(0, 3000);

    const prompt = `
Return ONLY valid JSON:

{
  "problems": [
    {
      "problem": "",
      "segment": "",
      "confidence": 0.0,
      "reason": "",
      "evidence_ids": [0]
    }
  ]
}

Query: ${query}

Posts:
${context}
`;

    const raw = await runLLM(prompt);

    const parsed = JSON.parse(raw);

    return new Response(
      JSON.stringify({
        output: parsed,
        posts,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}