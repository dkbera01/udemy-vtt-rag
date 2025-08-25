import { NextResponse } from "next/server";
import { retrieve } from "@/lib/qdrant";
import { openai, rewriteQuery } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    // Optionally rewrite the query (disabled)
    // const rewritten = await rewriteQuery(query);

    const hits = await retrieve(query, 6);
    if (!hits.length) {
      return NextResponse.json({
        answer: "I couldn't find anything relevant in your transcripts. Try rephrasing or ingest more lectures."
      });
    }

    const context = hits
      .map((h, i) => 
        `Chunk ${i + 1} [${h.start} → ${h.end}] (Lecture: ${h.lecture_id})\n${h.text}`
      )
      .join("\n\n");

    const sys = `You are an assistant that answers ONLY using the provided transcript context.

- ALWAYS cite timestamps in the format [start → end].
- ALWAYS include lecture IDs in the format (Lecture: <lecture_id>).
- If the context does not contain the answer, clearly respond:
  "I couldn’t find any relevant information in the provided transcripts. Try rephrasing your question or adding more lecture data."
- DO NOT use any outside knowledge or assumptions.
- Format your answer clearly using bullet points, numbered lists, or short paragraphs if needed.
- Every reference must explicitly show BOTH a timestamp and a lecture ID.`;

    // const user = `Original question: "${query}"\nRewritten search query: "${rewritten}"\n\nContext:\n${context}\n\nAnswer:`;
    const user = `Original question: "${query}"\nContext:\n${context}\n\nAnswer:`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user }
      ]
    });

    const answer = res.choices[0].message?.content ?? "No answer.";
    return NextResponse.json({ answer, results: hits });
    // return NextResponse.json({ answer, rewrittenQuery: rewritten, results: hits });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
