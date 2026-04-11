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
          "Content-Type": "application/json", // 🔥 VERY IMPORTANT
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
        return;
      }

      if (!res.ok || (result && typeof result === "object" && "error" in result)) {
        setError(
          typeof result === "object" && result && "error" in result && typeof (result as { error: unknown }).error === "string"
            ? (result as { error: string }).error
            : `Request failed (${res.status})`
        );
        return;
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insights");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <input
        className="border p-2 w-full rounded"
        placeholder="Enter product (e.g. Stripe pricing complaints)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={fetchInsights}
        className="mt-2 bg-black text-white px-4 py-2 rounded"
      >
        Analyze
      </button>

      {/* Loading */}
      {loading && <p className="mt-4 text-gray-500">Analyzing...</p>}

      {/* Error */}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {/* Result */}
      {data && (
        <div className="mt-4">
          <h2 className="font-bold text-lg">Insights</h2>
          <pre className="bg-gray-100 p-3 rounded mt-2 whitespace-pre-wrap">
            {data.insights}
          </pre>
        </div>
      )}
    </div>
  );
}