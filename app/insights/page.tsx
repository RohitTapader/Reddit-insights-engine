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

      <div className="flex justify-between">
        <h2 className="font-semibold">{problem.problem}</h2>

        <div className="flex gap-2 text-xs">
          <span className="bg-red-700 px-2 py-1 rounded">
            {problem.severity}
          </span>
          <span className="bg-blue-700 px-2 py-1 rounded">
            {problem.frequency}
          </span>
        </div>
      </div>

      <p className="text-gray-400 mt-2 text-sm">
        {problem.frequency_reason}
      </p>

      <p className="mt-3 text-gray-300">
        <b>Root:</b> {problem.root_cause}
      </p>

      <p className="text-green-400 mt-2">
        <b>Action:</b> {problem.suggested_action}
      </p>

      <p className="text-sm mt-2 text-gray-400">
        Confidence: {(problem.confidence_score * 100).toFixed(0)}%
        <span className="ml-2">({problem.confidence_reason})</span>
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 text-blue-400 text-sm"
      >
        {open ? "Hide Evidence ▲" : "View Evidence ▼"}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {evidencePosts.map((post: any, i: number) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              className="block border p-2 rounded hover:bg-gray-800"
            >
              <p>{post.title}</p>
              <p className="text-xs text-gray-400">
                r/{post.subreddit} ⬆ {post.score} 💬 {post.comments}
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

  const fetchInsights = async () => {
    const res = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const result = await res.json();
    setData(result);
  };

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 w-full bg-gray-900"
      />

      <button onClick={fetchInsights} className="mt-2 bg-white text-black p-2">
        Analyze
      </button>

      {data && (
        <div className="mt-6 space-y-4">
          {data.insights.problems.map((p: any, i: number) => (
            <ProblemCard key={i} problem={p} posts={data.posts} />
          ))}
        </div>
      )}
    </div>
  );
}