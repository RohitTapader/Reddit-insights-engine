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

/** Reddit rejects many server requests without a descriptive User-Agent (returns HTML, breaks JSON.parse). */
const DEFAULT_REDDIT_UA =
  "web:reddit-insights-engine:v1.0 (serverless; see https://github.com/reddit-archive/reddit/wiki/API)";

export class RedditFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedditFetchError";
  }
}

export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10&raw_json=1`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": process.env.REDDIT_USER_AGENT ?? DEFAULT_REDDIT_UA,
      Accept: "application/json",
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const bodyText = await res.text();

  if (!contentType.includes("application/json")) {
    throw new RedditFetchError(
      "Reddit returned a non-JSON response (often blocked without a valid User-Agent or from datacenter IPs)."
    );
  }

  if (!res.ok) {
    throw new RedditFetchError(`Reddit HTTP ${res.status}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    throw new RedditFetchError("Reddit response was not valid JSON.");
  }

  const root = parsed as {
    data?: { children?: RedditListingChild[] };
    message?: string;
  };

  const children = root.data?.children;
  if (!Array.isArray(children)) {
    const msg =
      typeof root.message === "string" ? root.message : "Unexpected Reddit response shape.";
    throw new RedditFetchError(msg);
  }

  return children.map(({ data: d }) => ({
    title: d.title,
    content: d.selftext || "",
    subreddit: d.subreddit,
    url: `https://reddit.com${d.permalink}`,
  }));
}
