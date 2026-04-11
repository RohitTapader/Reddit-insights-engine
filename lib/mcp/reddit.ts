export type RedditPost = {
    title: string;
    content: string;
    subreddit: string;
    url: string;
  };
  
  export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
    const q = encodeURIComponent(query);
  
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${q}&limit=10&raw_json=1`,
      {
        headers: {
          "User-Agent": "reddit-insights-engine/1.0",
          Accept: "application/json",
        },
      }
    );
  
    if (!res.ok) {
      throw new Error(`Reddit API failed: ${res.status}`);
    }
  
    const data = await res.json();
  
    return data.data.children.map((p: any) => ({
      title: p.data.title,
      content: p.data.selftext || "",
      subreddit: p.data.subreddit,
      url: `https://reddit.com${p.data.permalink}`,
    }));
  }