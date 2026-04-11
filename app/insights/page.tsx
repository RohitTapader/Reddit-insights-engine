"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInsights = async () => {
    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const text = await res.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        setError("Server error (invalid response)");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(result.error || "Something went wrong");
      } else {
        setData(result);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insights");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Product Insights</h1>

        {/* Input Section */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <input
            className="w-full p-3 rounded bg-black border border-gray-700 placeholder-gray-500 focus:outline-none"
            placeholder="Try: Stripe pricing complaints, Notion AI feedback..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            onClick={fetchInsights}
            className="mt-4 w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Analyze
          </button>
        </div>

        {/* Loading */}
        {loading && (
  <div className="mt-6 animate-pulse space-y-3">
    <div className="h-4 bg-gray-700 rounded"></div>
    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
  </div>
)}

{data && data.insights?.pain_points?.length === 0 && (
  <p className="text-gray-400 mt-4">
    No strong insights found. Try refining your query.
  </p>
)}

{data?.intent && (
  <p className="text-sm text-gray-500 mt-2">
    Detected intent: {data.intent}
  </p>
)}

        {/* Error */}
        {error && (
          <p className="mt-6 text-red-500 bg-red-900/20 p-3 rounded">
            {error}
          </p>
        )}

        {/* Results */}
        {data && (
          <div className="mt-10 space-y-8">

            {/* Quadrant Layout */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Pain Points */}
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-3 text-red-400">
                  Pain Points
                </h2>

                <ul className="space-y-2 text-gray-300">
                  {data.insights?.pain_points?.map(
                    (item: string, i: number) => (
                      <li
                        key={i}
                        className="border-b border-gray-800 pb-2"
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-green-900/20 border border-green-800 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-3 text-green-400">
                  Opportunities
                </h2>

                <ul className="space-y-2 text-gray-300">
                  {data.insights?.opportunities?.map(
                    (item: string, i: number) => (
                      <li
                        key={i}
                        className="border-b border-gray-800 pb-2"
                      >
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>

            </div>

            {/* Reddit Discussions */}
            {data.posts && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4">
                  Relevant Reddit Discussions
                </h2>

                <div className="space-y-4">
                  {data.posts.slice(0, 5).map(
                    (post: any, index: number) => (
                      <a
                        key={index}
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-gray-800 p-4 rounded-lg hover:bg-gray-800 transition"
                      >
                        <p className="font-medium text-white">
                          {post.title}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-2">
                          <span>r/{post.subreddit}</span>

                          {post.score !== undefined && (
                            <span>⬆ {post.score}</span>
                          )}

                          {post.comments !== undefined && (
                            <span>💬 {post.comments}</span>
                          )}
                        </div>
                      </a>
                    )
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}