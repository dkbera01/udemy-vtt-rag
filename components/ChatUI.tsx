'use client';
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Hit = {
  text: string;
  lecture_id: string;
  start: string;
  end: string;
  score: number;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant', content: string }[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function ask() {
    if (!query.trim()) return;
    const userMsg = { role: 'user' as const, content: query };
    setMessages(m => [...m, userMsg]);
    setQuery('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      const content = data.answer ?? 'No answer';
      setMessages(m => [...m, { role: 'assistant', content }]);
    } catch (e:any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + e?.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-[65vh] overflow-y-auto rounded-2xl border border-white/10 p-4 bg-white/5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block px-3 py-2 my-1 rounded-2xl ${m.role === 'user' ? 'bg-white/20' : 'bg-white/10'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && <div className="opacity-70 text-sm">Thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Ask across your Udemy transcripts…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
        />
        <Button onClick={ask}>Send</Button>
      </div>
      <p className="text-xs opacity-60">Tips: Ask for specific topics. Answers cite timestamps & lecture ids.</p>
    </div>
  );
}
