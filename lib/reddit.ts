export type RedditPost = {
    title: string;
    content: string;
    url: string;
    created: number;
  };
  
  function isHTML(text: string) {
    return text.trim().startsWith("<");
  }
  
  export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
    try {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            "User-Agent": "insights-engine/1.0",
          },
        }
      );
  
      const text = await res.text();
  
      // 🚨 handle HTML response (403 case)
      if (isHTML(text)) {
        console.error("Reddit returned HTML (likely blocked)");
        return [];
      }
  
      const json = JSON.parse(text);
  
      return json.data.children.map((c: any) => ({
        title: c.data.title,
        content: c.data.selftext || "",
        url: `https://reddit.com${c.data.permalink}`,
        created: c.data.created_utc,
      }));
    } catch (err) {
      console.error("Reddit fetch failed:", err);
      return [];
    }
  }