export type RedditPost = {
  title: string;
  content: string;
  subreddit: string;
  url: string;
};

type RedditListingChild = {
  data: {
    title: string;
    selftext?: string;
    subreddit: string;
    permalink: string;
  };
};

export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10`
  );

  const data = (await res.json()) as { data: { children: RedditListingChild[] } };

  return data.data.children.map(({ data: d }) => ({
    title: d.title,
    content: d.selftext || "",
    subreddit: d.subreddit,
    url: `https://reddit.com${d.permalink}`,
  }));
}