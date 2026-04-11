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
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">Product Insights</h1>

        {/* Input Section */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <input
            className="w-full p-3 rounded bg-black border border-gray-700 placeholder-gray-500"
            placeholder="Try: Stripe pricing complaints, Notion AI feedback..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            onClick={fetchInsights}
            className="mt-3 w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Analyze
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-6 text-gray-400">Analyzing Reddit discussions...</p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-6 text-red-500 bg-red-900/20 p-3 rounded">
            {error}
          </p>
        )}

        {/* Results */}
        {data && (
          <div className="mt-8 space-y-6">

            {/* Insights Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-3">Key Insights</h2>
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {data.insights}
              </div>
            </div>

            {/* Reddit Posts Preview */}
            {data.posts && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-3">
                  Sample Reddit Discussions
                </h2>

                <div className="space-y-4">
                  {data.posts.slice(0, 3).map((post: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-800 p-3 rounded-lg"
                    >
                      <p className="font-medium">{post.title}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {post.content.slice(0, 120)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}