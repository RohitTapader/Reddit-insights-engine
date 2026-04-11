"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      
      {/* HERO */}
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Reddit Insights Engine
        </h1>

        <p className="mt-4 text-gray-400 text-lg">
          Turn unstructured Reddit conversations into actionable product insights using AI.
        </p>

        {/* CTA */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => router.push("/insights")}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200"
          >
            Explore Insights
          </button>

          <button
            onClick={() => router.push("/ask")}
            className="border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800"
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        
        <FeatureCard
          title="Insights"
          desc="Identify pain points, feature gaps, and opportunities"
        />

        <FeatureCard
          title="Sentiment Analysis"
          desc="Understand user emotions and feedback trends"
        />

        <FeatureCard
          title="Competitor Analysis"
          desc="Compare competitors with SWOT and quadrant view"
        />
      </div>

    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-400 mt-2">{desc}</p>
    </div>
  );
}