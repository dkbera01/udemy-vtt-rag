import { NextResponse } from "next/server";
import { retrieve } from "@/lib/qdrant";
import { openai, rewriteQuery } from "@/lib/llm";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    // Step 1: Rewrite query (optional but recommended)
    const rewritten = await rewriteQuery(query);

    // Step 2: Retrieve more chunks than needed (to allow re-ranking)
    const rawHits = await retrieve(rewritten, 15);
    if (!rawHits.length) {
      return NextResponse.json({
        answer:
          "I couldn’t find any relevant information in the provided transcripts. Try rephrasing your question or adding more lecture data.",
      });
    }

    // Step 3: Re-rank chunks using LLM (to pick the most relevant)
    const rerankPrompt = `
      You are given a user query and a list of transcript chunks.
      Rank ONLY the most relevant 6 chunks in descending order of relevance.
      Return JSON array of objects with fields: { index, score }.

      User query: "${query}"
      Transcript chunks:
      ${rawHits
        .map(
          (h, i) =>
            `[${i}] Lecture: ${h.lecture_id}, ${h.start}→${h.end}\n${h.text}`
        )
        .join("\n\n")}
      `;

    const rerankRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: rerankPrompt }],
    });

    const rerankText = rerankRes.choices[0].message?.content || "[]";
    let topIndices: number[] = [];
    try {
      const parsed = JSON.parse(rerankText);
      topIndices = parsed.slice(0, 6).map((r: any) => r.index);
    } catch {
      // fallback: just take first 6
      topIndices = rawHits.slice(0, 6).map((_, i) => i);
    }
    const hits = topIndices.map((i) => rawHits[i]);

    // Step 4: Compress chunks (optional, keeps context small)
    const compressedChunks: string[] = [];
    for (const h of hits) {
      const compressPrompt = `Summarize this transcript chunk in 2 sentences:\n${h.text}`;
      const comp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [{ role: "user", content: compressPrompt }],
      });
      compressedChunks.push(comp.choices[0].message?.content?.trim() || h.text);
    }

    // Step 5: Build context grouped by lecture
    const context = hits
      .map(
        (h, i) =>
          `Chunk ${i + 1} [${h.start} → ${h.end}] (Lecture: ${h.lecture_id})\n${
            compressedChunks[i]
          }`
      )
      .join("\n\n");

    // Step 6: Ask final question with strong grounding
    const sys = `You are an assistant that answers ONLY using the provided transcript context.

- ALWAYS cite timestamps as [start → end].
- ALWAYS include lecture IDs as (Lecture: <id>).
- If you cannot answer from the context, say exactly:
  "I couldn’t find any relevant information in the provided transcripts. Try rephrasing your question or adding more lecture data."
- Do NOT use outside knowledge.
- Format answers clearly with bullet points or short paragraphs.
- Every reference MUST include BOTH a timestamp and a lecture ID.`;

    const user = `Original question: "${query}"\nRewritten search query: "${rewritten}"\n\nContext:\n${context}\n\nAnswer:`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });

    const answer =
      res.choices[0].message?.content ??
      "I couldn’t find any relevant information in the provided transcripts. Try rephrasing your question or adding more lecture data.";

    return NextResponse.json({ answer, results: hits });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
