import Link from "next/link";
export default function Page() {
  return (
    <main className="grid place-items-center h-[70vh]">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Ask your Udemy courses</h2>
        <p className="opacity-80">Accurate answers grounded in transcripts, with timestamps.</p>
        <Link href="/chat" className="inline-block px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 transition">
          Open Chat
        </Link>
      </div>
    </main>
  );
}
