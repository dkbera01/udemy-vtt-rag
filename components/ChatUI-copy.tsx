'use client';
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function renderMessage(content: string) {
  // Try to detect JSON
  try {
    const obj = JSON.parse(content);
    return (
      <pre className="bg-black/30 p-3 rounded-xl text-left overflow-x-auto text-xs">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  } catch {
    // Not JSON → continue
  }

  // Detect code fences (markdown)
  if (content.includes("```")) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    );
  }

  // Fallback → normal markdown/plain text
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function ask() {
    if (!query.trim()) return;
    const userMsg: Message = { role: 'user', content: query };
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
    } catch (e: any) {
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
            <div className={`inline-block px-3 py-2 my-1 rounded-2xl max-w-[80%] ${
              m.role === 'user' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              <div className="whitespace-pre-wrap">{renderMessage(m.content)}</div>
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
      <p className="text-xs opacity-60">Tips: Request particular subjects. Responses include lecture IDs and timestamps.</p>
    </div>
  );
}
