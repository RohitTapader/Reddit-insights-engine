"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!query) return;

    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Decision Intelligence Engine
          </h1>
          <p className="text-gray-400">
            Make product decisions based on real user discussions
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <input
            className="flex-1 p-4 rounded-xl text-black text-lg outline-none"
            placeholder="Search product (e.g. iPhone battery issue, baby diapers rash)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          <div className="text-gray-400">Analyzing real user discussions...</div>
        )}

        {/* ERROR / EMPTY */}
        {data?.message && (
          <div className="text-yellow-400 mt-4">{data.message}</div>
        )}

        {/* META INFO */}
        {data?.meta && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-400">
            <span>Category: {data.category}</span>
            <span>Posts analyzed: {data.meta.totalPosts}</span>
            <span>
              Avg Confidence: {(data.meta.avgConfidence * 100).toFixed(0)}%
            </span>
            {data.meta.refinementApplied && (
              <span className="text-blue-400">Refined Results Applied</span>
            )}
          </div>
        )}

        {/* RESULTS */}
        {data?.output?.problems?.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {data.output.problems.map((p: any, i: number) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition"
              >
                {/* PROBLEM TITLE */}
                <h3 className="text-lg font-semibold mb-2">
                  {p.problem}
                </h3>

                {/* SEGMENT + CONFIDENCE */}
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-blue-400">
                    {p.segment}
                  </span>
                  <span className="text-green-400">
                    {(p.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* REASON */}
                <p className="text-gray-300 text-sm mb-4">
                  {p.reason}
                </p>

                {/* EVIDENCE */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Evidence from real discussions:
                  </p>

                  <div className="space-y-1">
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
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {data && data.output?.problems?.length === 0 && (
          <div className="text-gray-400 mt-6">
            No strong decision signals found. Try a more specific query.
          </div>
        )}
      </div>
    </div>
  );
}