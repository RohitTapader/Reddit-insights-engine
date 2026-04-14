export async function fetchRedditPosts(query: string) {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=15`,
      {
        headers: {
          "User-Agent": "reddit-insights-engine",
        },
      }
    );
  
    const data = await res.json();
  
    return data.data.children.map((p: any) => ({
      title: p.data.title,
      content: p.data.selftext || "",
      subreddit: p.data.subreddit,
      url: `https://reddit.com${p.data.permalink}`,
      score: p.data.score,
      comments: p.data.num_comments,
    }));
  }