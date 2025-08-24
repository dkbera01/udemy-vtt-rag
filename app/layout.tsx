import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Udemy VTT RAG",
  description: "Ask across Udemy VTT transcripts with timestamped answers."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-semibold">Udemy VTT RAG</h1>
            <nav className="text-sm opacity-75">Chat · Ingest</nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
