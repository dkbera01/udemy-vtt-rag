import Link from "next/link";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VTT RAG",
  description: "Ask across VTT transcripts with timestamped answers."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-semibold"><Link href="/chat" >VTT RAG</Link></h1>
            <Link href="/upload" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">Upload VVT Source</Link>
            <nav className="text-sm opacity-75">Chat</nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
