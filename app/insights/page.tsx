"use client";

import { useState } from "react";

function ProblemCard({ problem, posts }: any) {
  const [open, setOpen] = useState(false);

  const evidencePosts = problem.evidence_post_ids
    ?.map((id: number) => posts[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{problem.problem}</h2>

        <div className="flex gap-2 text-xs">
          <span className="bg-red-700 px-2 py-1 rounded">
            {problem.severity}
          </span>
          <span className="bg-blue-700 px-2 py-1 rounded">
            {problem.frequency}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <p className="text-gray-400 text-sm mt-2">
        {problem.frequency_reason}
      </p>

      {/* Root cause */}
      <p className="mt-3 text-gray-300">
        <b>Root cause:</b> {problem.root_cause}
      </p>

      {/* Confidence */}
      <p className="text-sm mt-3 text-gray-400">
        Confidence: {(problem.confidence_score * 100).toFixed(0)}%
        <span className="ml-2 text-gray-500">
          ({problem.confidence_reason})
        </span>
      </p>

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-4 text-sm text-blue-400 hover:underline"
      >
        {open ? "Hide Evidence ▲" : "View Evidence ▼"}
      </button>

      {/* Evidence */}
      {open && (
        <div className="mt-4 space-y-3">
          {evidencePosts.map((post: any, i: number) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-800 p-3 rounded-lg hover:bg-gray-800 transition"
            >
              <p className="font-medium">{post.title}</p>

              <div className="text-xs text-gray-400 mt-1 flex gap-3">
                <span>r/{post.subreddit}</span>
                <span>⬆ {post.score}</span>
                <span>💬 {post.comments}</span>
              </div>
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

  const fetchInsights = async () => {
    const res = await fetch("/api/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const result = await res.json();
    setData(result);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-4">
          Reddit Insight Engine
        </h1>

        <p className="text-gray-400 text-sm mb-6">
          Extracted user problems from real Reddit discussions.
        </p>

        {/* Input */}
        <input
          className="w-full p-3 rounded bg-gray-900 border border-gray-700"
          placeholder="Try: Stripe pricing complaints"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={fetchInsights}
          className="mt-3 bg-white text-black px-5 py-2 rounded-lg"
        >
          Analyze
        </button>

        {/* Results */}
        {data && (
          <div className="mt-8 space-y-6">
            {data.insights?.problems?.map((p: any, i: number) => (
              <ProblemCard key={i} problem={p} posts={data.posts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}