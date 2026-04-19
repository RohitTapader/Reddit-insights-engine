export type RedditPost = {
    title: string;
    content: string;
    url: string;
    created: number;
  };
  
  function safeParse(text: string) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  
  export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
    const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://www.reddit.com/search.json?q=${query}&limit=10`
    )}`;
  
    try {
      const res = await fetch(url);
  
      const text = await res.text();
      const json = safeParse(text);
  
      if (!json || !json.data?.children) {
        console.error("Invalid Reddit response");
        return [];
      }
  
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