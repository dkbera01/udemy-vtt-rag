import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import { chunkSentences } from "@/scripts/parseVTT";
import path from "path";
import { embed } from "./embeddings";


const COLLECTION = process.env.QDRANT_COLLECTION || "udemy_transcripts";

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});


export async function ingestVTTBuffer(buffer: Buffer, filename: string) {
  const vttText = buffer.toString("utf-8");
  const sentences = parseVTTFromString(vttText, filename);
  const chunks = chunkSentences(sentences, 60);
  for (const c of chunks) {
    const vector = await embed(c.text);
    await client.upsert(COLLECTION, {
      points: [{
        id: uuidv4(),
        vector,
        payload: {
          text: c.text,
          lecture_id: c.lecture_id,
          start: c.start,
          end: c.end
        }
      }]
    });
  }
}

// Helper to parse VTT from string (for upload)
function parseVTTFromString(vtt: string, filename: string) {
  const lines = vtt.split(/\r?\n/);
  const chunks: any[] = [];
  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx].trim();
    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map(s => s.trim());
      idx++;
      const textLines: string[] = [];
      while (idx < lines.length && lines[idx].trim() !== "") {
        textLines.push(lines[idx].trim());
        idx++;
      }
      const text = textLines.join(" ");
      chunks.push({
        id: `${path.basename(filename)}-${chunks.length}`,
        text,
        start,
        end,
        lecture_id: path.basename(filename, ".vtt")
      });
    }
    idx++;
  }
  return chunks;
}
