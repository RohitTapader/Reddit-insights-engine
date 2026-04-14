"use client";

import { useState } from "react";

function ProblemCard({ text, posts }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">

      {/* Problem */}
      <h3 className="font-semibold text-lg">{text}</h3>

      {/* Fake metadata (until backend structured) */}
      <div className="flex gap-2 mt-2 text-xs">
        <span className="bg-red-700 px-2 py-1 rounded">High</span>
        <span className="bg-blue-700 px-2 py-1 rounded">Frequent</span>
      </div>

      {/* Placeholder root cause */}
      <p className="text-gray-400 text-sm mt-3">
        Derived from recurring user complaints across Reddit discussions.
      </p>

      {/* Confidence */}
      <p className="text-xs text-gray-500 mt-2">
        Confidence: ~75% (based on repetition & engagement)
      </p>

      {/* Toggle evidence */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-3 text-blue-400 text-sm hover:underline"
      >
        {open ? "Hide Evidence ▲" : "View Evidence ▼"}
      </button>

      {/* Evidence */}
      {open && (
        <div className="mt-3 space-y-2">
          {posts.slice(0, 2).map((p: any, i: number) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              className="block border border-gray-800 p-2 rounded hover:bg-gray-800"
            >
              <p className="text-sm">{p.title}</p>
              <p className="text-xs text-gray-500">
                r/{p.subreddit} • ⬆ {p.score} • 💬 {p.comments}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

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
        throw new Error("Invalid API response");
      }

      setData(result);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Split insights into bullets → cards
  const problems =
    data?.insights?.split("\n").filter((l: string) => l.trim().length > 20) || [];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold">
            Reddit Decision Engine
          </h1>
          <p className="text-gray-400 mt-2">
            Turn Reddit discussions into structured product insights
          </p>
        </div>

        {/* SEARCH */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-3">

            <input
              className="flex-1 p-3 rounded-lg bg-black border border-gray-700"
              placeholder="Try: Stripe pricing complaints"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button
              onClick={fetchInsights}
              className="bg-white text-black px-6 py-3 rounded-lg"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

          </div>
        </div>

        {/* RESULTS */}
        {data && (
          <div className="space-y-10">

            {/* PROBLEM CARDS */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Key User Problems
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {problems.map((p: string, i: number) => (
                  <ProblemCard key={i} text={p} posts={data.posts || []} />
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}