import { runLLM } from "./llm";

export type Category =
  | "electronics"
  | "baby_care"
  | "fashion"
  | "appliances"
  | "other";

function safeParseJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // attempt to extract JSON if LLM added extra text
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

export async function classifyCategory(
  query: string
): Promise<{ category: Category }> {
  const prompt = `
You are a strict classifier.

Classify the product into ONE category:

Allowed categories:
- electronics
- baby_care
- fashion
- appliances
- other

Query: "${query}"

Return ONLY valid JSON:
{
  "category": ""
}
`;

  try {
    const res = await runLLM(prompt);

    const parsed = safeParseJSON(res);

    if (
      parsed &&
      typeof parsed.category === "string" &&
      ["electronics", "baby_care", "fashion", "appliances", "other"].includes(
        parsed.category
      )
    ) {
      return { category: parsed.category };
    }

    return { category: "other" };
  } catch (err) {
    return { category: "other" };
  }
}