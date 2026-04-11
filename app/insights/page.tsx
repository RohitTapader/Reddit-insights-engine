"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchInsights = async () => {
    const res = await fetch("/api/insights", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    const result = await res.json();
    setData(result);
  };

  return (
    <div className="p-6">
      <input
        className="border p-2 w-full"
        placeholder="Enter product..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button onClick={fetchInsights} className="mt-2 bg-black text-white p-2">
        Analyze
      </button>

      {data && (
        <div className="mt-4">
          <h2 className="font-bold">Insights</h2>
          <pre>{data.insights}</pre>
        </div>
      )}
    </div>
  );
}