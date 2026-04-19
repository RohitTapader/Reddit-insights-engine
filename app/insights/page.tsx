"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 CLIENT-SIDE REDDIT FETCH (KEY FIX)
  async function fetchReddit(query: string) {
    try {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(
          query
        )}&limit=10`
      );

      const json = await res.json();

      return json.data.children.map((c: any) => ({
        title: c.data.title,
        content: c.data.selftext || "",
        url: `https://reddit.com${c.data.permalink}`,
      }));
    } catch (err) {
      console.error("Reddit fetch error:", err);
      return [];
    }
  }

  // 🔥 MAIN FLOW
  const fetchInsights = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      // 1. Fetch Reddit posts (client side)
      const posts = await fetchReddit(query);

      if (!posts.length) {
        setError("No Reddit discussions found. Try a different query.");
        setLoading(false);
        return;
      }

      // 2. Send to backend for LLM processing
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          posts,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while analyzing.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center px-4 py-12">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">
          Decision Intelligence Engine
        </h1>
        <p className="text-gray-400">
          Analyze real user discussions to make product decisions
        </p>
      </div>

      {/* INPUT */}
      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Try: nike pegasus 41 comfort"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 outline-none border border-gray-700 focus:border-white caret-white"
        />

        <button
          onClick={fetchInsights}
          className="bg-white text-black px-6 py-4 rounded-xl font-semibold hover:opacity-90"
        >
          Analyze
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="mt-6 text-gray-400">
          Fetching and analyzing discussions...
        </p>
      )}

      {/* ERROR */}
      {error && (
        <p className="mt-6 text-red-400">{error}</p>
      )}

      {/* RESULTS */}
      {data?.output?.problems?.length > 0 && (
        <div className="mt-10 w-full max-w-5xl grid md:grid-cols-2 gap-6">
          {data.output.problems.map((p: any, i: number) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <h3 className="font-semibold text-lg mb-2">
                {p.problem}
              </h3>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-400">{p.segment}</span>
                <span className="text-green-400">
                  {(p.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-gray-300 text-sm mb-3">
                {p.reason}
              </p>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Evidence:
                </p>

                {p.evidence_ids.map((id: number) => {
                  const post = data.posts[id];
                  if (!post) return null;

                  return (
                    <a
                      key={id}
                      href={post.url}
                      target="_blank"
                      className="block text-blue-400 text-sm underline hover:text-blue-300"
                    >
                      {post.title}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY */}
      {data && data.output?.problems?.length === 0 && (
        <p className="mt-6 text-gray-400">
          No strong signals found. Try refining your query.
        </p>
      )}
    </div>
  );
}