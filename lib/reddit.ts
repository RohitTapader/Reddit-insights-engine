export type RedditPost = {
    title: string;
    content: string;
    url: string;
    created: number;
  };
  
  function isHTML(text: string) {
    return text.trim().startsWith("<");
  }
  
  async function searchReddit(query: string): Promise<RedditPost[]> {
    try {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "User-Agent": "insights-engine/1.0",
          },
        }
      );
  
      const text = await res.text();
  
      if (isHTML(text)) return [];
  
      const json = JSON.parse(text);
  
      return json.data.children.map((c: any) => ({
        title: c.data.title,
        content: c.data.selftext || "",
        url: `https://reddit.com${c.data.permalink}`,
        created: c.data.created_utc,
      }));
    } catch {
      return [];
    }
  }
  
  export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
    // 🔥 QUERY EXPANSION
    const queries = [
      query,
      `${query} review`,
      `${query} problem`,
      `${query} experience`,
      `${query} reddit`,
    ];
  
    let allPosts: RedditPost[] = [];
  
    for (const q of queries) {
      const results = await searchReddit(q);
      allPosts = [...allPosts, ...results];
    }
  
    // 🔥 DEDUP
    const unique = new Map();
    allPosts.forEach((p) => {
      const key = p.title.toLowerCase();
      if (!unique.has(key)) unique.set(key, p);
    });
  
    return Array.from(unique.values()).slice(0, 10);
  }