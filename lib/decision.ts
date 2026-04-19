import { runLLM } from "./llm";

type Problem = {
  problem: string;
  segment: string;
  confidence: number;
  reason: string;
  evidence_ids: number[];
};

function safeParseJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeConfidence(value: any): number {
  const num = Number(value);
  if (isNaN(num)) return 0.5;
  if (num > 1) return Math.min(num / 100, 1);
  if (num < 0) return 0;
  return num;
}

function validateProblems(problems: any[]): Problem[] {
  if (!Array.isArray(problems)) return [];

  return problems
    .map((p) => ({
      problem: String(p.problem || "").slice(0, 200),
      segment: String(p.segment || "general"),
      confidence: normalizeConfidence(p.confidence),
      reason: String(p.reason || "").slice(0, 300),
      evidence_ids: Array.isArray(p.evidence_ids)
        ? p.evidence_ids.filter((id: any) => typeof id === "number")
        : [],
    }))
    .filter((p) => p.problem.length > 10);
}

export async function generateDecision(
  posts: any[],
  segments: string[]
): Promise<{ problems: Problem[] }> {
  const context = posts
    .map((p, i) => `[${i}] ${p.title} ${p.content}`)
    .join("\n");

  const prompt = `
You are a product decision intelligence engine.

Your job is to extract REAL user problems from discussions.

Rules:
- ONLY use the given posts
- DO NOT hallucinate
- Each problem MUST be backed by evidence_ids
- Map each problem to ONE of these segments: ${segments.join(", ")}
- If unsure, use "general"
- Confidence should reflect agreement across posts

${context}

Return STRICT JSON:

{
  "problems": [
    {
      "problem": "clear user pain point",
      "segment": "",
      "confidence": 0.0,
      "reason": "why this problem exists based on posts",
      "evidence_ids": [0,1]
    }
  ]
}
`;

  try {
    const res = await runLLM(prompt);

    const parsed = safeParseJSON(res);

    const problems = validateProblems(parsed?.problems || []);

    return { problems };
  } catch {
    return { problems: [] };
  }
}