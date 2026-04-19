"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-start px-4 py-12">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">
          Decision Intelligence Engine
        </h1>
        <p className="text-gray-400">
          Make product decisions based on real user discussions
        </p>
      </div>

      {/* INPUT SECTION */}
      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Try: iphone battery issue, baby diapers rash..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-4 rounded-xl bg-gray-800 text-white
          placeholder-gray-400 text-lg outline-none
          border border-gray-700 focus:border-white
          transition"
        />

        <button
          onClick={fetchInsights}
          className="bg-white text-black px-6 py-4 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Analyze
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="mt-6 text-gray-400">
          Analyzing real discussions...
        </p>
      )}

      {/* RESULTS */}
      {data?.output?.problems && (
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
                      className="block text-blue-400 text-sm underline"
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

      {/* EMPTY STATE */}
      {data && data.output?.problems?.length === 0 && (
        <p className="mt-6 text-gray-400">
          No strong signals found. Try a more specific query.
        </p>
      )}
    </div>
  );
}