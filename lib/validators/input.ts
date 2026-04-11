const BLOCKED = ["hate", "violence", "religion", "porn"];

export function validateInput(query: string) {
  if (!query || query.length < 3) return "Query too short";

  if (query.length > 200) return "Query too long";

  if (BLOCKED.some((w) => query.toLowerCase().includes(w))) {
    return "Inappropriate content detected";
  }

  return null;
}

export function isRelevant(query: string) {
    const keywords = ["product", "software", "pricing", "tool", "ai"];
  
    return keywords.some((k) => query.toLowerCase().includes(k));
  }