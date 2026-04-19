export async function fetchRedditPosts(query: string) {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=20`
    );
  
    const json = await res.json();
  
    const now = Date.now();
  
    const posts = json.data.children.map((c: any) => ({
      title: c.data.title,
      content: c.data.selftext || "",
      url: `https://reddit.com${c.data.permalink}`,
      created: c.data.created_utc,
    }));
  
    // Freshness filter (30 days)
    const fresh = posts.filter(
      (p: any) => now - p.created * 1000 < 30 * 24 * 60 * 60 * 1000
    );
  
    // Dedup (simple)
    const unique = new Map();
    fresh.forEach((p: any) => {
      const key = p.title.toLowerCase().slice(0, 80);
      if (!unique.has(key)) unique.set(key, p);
    });
  
    return Array.from(unique.values()).slice(0, 10);
  }