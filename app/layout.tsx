import "./globals.css";

export const metadata = {
  title: "Reddit Insights Engine",
  description: "AI-powered Reddit insights for product managers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

/* ================= NAVBAR ================= */

function Navbar() {
  return (
    <div className="w-full border-b border-gray-800 px-6 py-4 flex justify-between items-center bg-black text-white sticky top-0 z-50">
      
      {/* Logo */}
      <a href="/" className="font-bold text-lg">
        Reddit AI
      </a>

      {/* Navigation */}
      <div className="flex gap-6 text-sm text-gray-300">
        <a href="/insights" className="hover:text-white">
          Insights
        </a>
        <a href="/sentiment" className="hover:text-white">
          Sentiment
        </a>
        <a href="/competitors" className="hover:text-white">
          Competitors
        </a>
        <a href="/ask" className="hover:text-white">
          Ask AI
        </a>
      </div>
    </div>
  );
}