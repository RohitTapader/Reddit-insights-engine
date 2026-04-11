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
 * Public .json URLs often return 403/HTML from datacenters (e.g. Vercel).
 * Fix: set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET from https://www.reddit.com/prefs/apps
 * (create an "installed" app for application-only OAuth — see Reddit OAuth2 wiki).
 *
 * User-Agent is still required for all Reddit HTTP calls.
 */
const DEFAULT_REDDIT_UA =
  "web:reddit-insights-engine:v1.0 (serverless; see https://github.com/reddit-archive/reddit/wiki/API)";

export class RedditFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedditFetchError";
  }
}

let tokenCache: { token: string; expiresAtMs: number } | null = null;

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const pair = `${clientId}:${clientSecret}`;
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(pair, "utf8").toString("base64")
      : btoa(pair);
  return `Basic ${b64}`;
}

async function getAppOnlyBearerToken(userAgent: string): Promise<{ token: string; expiresInSec: number }> {
  const id = process.env.REDDIT_CLIENT_ID?.trim();
  const secret = (process.env.REDDIT_CLIENT_SECRET ?? "").trim();

  if (!id) {
    throw new RedditFetchError("Missing REDDIT_CLIENT_ID for Reddit OAuth.");
  }

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(id, secret),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const raw = await res.text();
  let data: { access_token?: string; expires_in?: number; error?: string };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new RedditFetchError(`Reddit OAuth token response was not JSON (HTTP ${res.status}).`);
  }

  if (!res.ok || !data.access_token) {
    const hint = data.error ?? raw.slice(0, 180);
    throw new RedditFetchError(
      `Reddit OAuth failed (HTTP ${res.status}): ${hint}. Use an "installed" app at reddit.com/prefs/apps if client_credentials is rejected.`
    );
  }

  return { token: data.access_token, expiresInSec: typeof data.expires_in === "number" ? data.expires_in : 3600 };
}

async function getCachedBearerToken(userAgent: string): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAtMs - 120_000) {
    return tokenCache.token;
  }

  const { token, expiresInSec } = await getAppOnlyBearerToken(userAgent);
  tokenCache = {
    token,
    expiresAtMs: now + expiresInSec * 1000,
  };
  return token;
}

function looksLikeHtml(body: string): boolean {
  const t = body.trimStart().slice(0, 64).toLowerCase();
  return t.startsWith("<!") || t.startsWith("<html") || t.startsWith("<body");
}

function parseListing(bodyText: string): RedditPost[] {
  if (looksLikeHtml(bodyText)) {
    throw new RedditFetchError(
      "Reddit returned HTML instead of JSON. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET for OAuth (reddit.com/prefs/apps)."
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

type Attempt = { url: string; authorization?: string };

export async function fetchRedditPosts(query: string): Promise<RedditPost[]> {
  const q = encodeURIComponent(query);
  const ua = process.env.REDDIT_USER_AGENT ?? DEFAULT_REDDIT_UA;

  /** Installed apps may use an empty secret; only client id is required for OAuth attempts. */
  const hasOAuthCreds = Boolean(process.env.REDDIT_CLIENT_ID?.trim());

  const attempts: Attempt[] = [];

  if (hasOAuthCreds) {
    const token = await getCachedBearerToken(ua);
    attempts.push({
      url: `https://oauth.reddit.com/search.json?q=${q}&limit=10&raw_json=1&type=link&restrict_sr=0`,
      authorization: `Bearer ${token}`,
    });
  }

  attempts.push(
    { url: `https://www.reddit.com/search.json?q=${q}&limit=10&raw_json=1` },
    { url: `https://old.reddit.com/search.json?q=${q}&limit=10&raw_json=1` }
  );

  let lastError: RedditFetchError | null = null;

  for (const { url, authorization } of attempts) {
    try {
      const headers: Record<string, string> = {
        "User-Agent": ua,
        Accept: "application/json",
      };
      if (authorization) {
        headers.Authorization = authorization;
      }

      const res = await fetch(url, { headers });
      const bodyText = await res.text();

      if (!res.ok) {
        if (res.status === 403 && !authorization) {
          lastError = new RedditFetchError(
            "Reddit returned 403 (forbidden). Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET from https://www.reddit.com/prefs/apps — create an app, then add both vars in Vercel."
          );
        } else {
          lastError = new RedditFetchError(`Reddit HTTP ${res.status}`);
        }
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
