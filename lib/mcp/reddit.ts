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

/**
 * Reddit often blocks datacenter/server fetches and returns HTML (<body...).
 * Do not trust Content-Type alone — some responses are HTML labeled as JSON.
 * A descriptive User-Agent is required: https://github.com/reddit-archive/reddit/wiki/API
 */
const DEFAULT_REDDIT_UA =
  "web:reddit-insights-engine:v1.0 (serverless; see https://github.com/reddit-archive/reddit/wiki/API)";

export class RedditFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedditFetchError";
  }
}

function looksLikeHtml(body: string): boolean {
  const t = body.trimStart().slice(0, 64).toLowerCase();
  return t.startsWith("<!") || t.startsWith("<html") || t.startsWith("<body");
}

function parseListing(bodyText: string): RedditPost[] {
  if (looksLikeHtml(bodyText)) {
    throw new RedditFetchError(
      "Reddit returned HTML instead of JSON (blocked or rate-limited from this server). Try REDDIT_USER_AGENT with your Reddit username per API rules, or use Reddit API OAuth."
    );
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

export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
  const q = encodeURIComponent(query);
  const paths = [
    `https://www.reddit.com/search.json?q=${q}&limit=10&raw_json=1`,
    `https://old.reddit.com/search.json?q=${q}&limit=10&raw_json=1`,
  ];

  const headers: HeadersInit = {
    "User-Agent": process.env.REDDIT_USER_AGENT ?? DEFAULT_REDDIT_UA,
    Accept: "application/json",
  };

  let lastError: RedditFetchError | null = null;

  for (const url of paths) {
    try {
      const res = await fetch(url, { headers });
      const bodyText = await res.text();

      if (!res.ok) {
        lastError = new RedditFetchError(`Reddit HTTP ${res.status}`);
        continue;
      }

      return parseListing(bodyText);
    } catch (e) {
      if (e instanceof RedditFetchError) {
        lastError = e;
        continue;
      }
      if (e instanceof SyntaxError) {
        lastError = new RedditFetchError("Reddit returned invalid JSON.");
        continue;
      }
      throw e;
    }
  }

  throw lastError ?? new RedditFetchError("Could not load Reddit search results.");
}
