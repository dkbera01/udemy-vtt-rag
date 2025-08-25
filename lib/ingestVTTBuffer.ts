import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import crypto from "crypto";
import path from "path";
import { embed } from "./embeddings";

const COLLECTION = process.env.QDRANT_COLLECTION || "udemy_transcripts";
const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

// ----------------------------
// Main ingest function
// ----------------------------
export async function ingestVTTBuffer(buffer: Buffer, filename: string) {
  const vttText = buffer.toString("utf-8");
  const sentences = parseVTTFromString(vttText, filename);

  // 1. Merge sentences into timestamp blocks (max 2 min or ~400 tokens)
  const mergedBlocks = mergeTimestampBlocks(sentences, {
    maxDurationSec: 120,
    maxChars: 2000,
  });

  // 2. Prepare LangChain splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const points = [];
  for (const block of mergedBlocks) {
    const subChunks = await splitter.splitText(block.text);

    for (const sub of subChunks) {
      const vector = await embed(sub);
      const checksum = crypto.createHash("md5").update(sub).digest("hex");

      points.push({
        id: uuidv4(),
        vector,
        payload: {
          text: sub,
          lecture_id: block.lecture_id,
          start: block.start,
          end: block.end,
          checksum,
          parent_index: block.index,
        },
      });
    }
  }

  if (points.length > 0) {
    await client.upsert(COLLECTION, { points });
  }

  return { success: true, count: points.length };
}

// ----------------------------
// Helper: parse VTT
// ----------------------------
function parseVTTFromString(vtt: string, filename: string) {
  const lines = vtt.split(/\r?\n/);
  const chunks: any[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx].trim();
    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((s) => s.trim());
      idx++;
      const textLines: string[] = [];
      while (idx < lines.length && lines[idx].trim() !== "") {
        textLines.push(lines[idx].trim());
        idx++;
      }
      const text = textLines.join(" ");
      chunks.push({
        index: chunks.length,
        text,
        start,
        end,
        lecture_id: path.basename(filename, ".vtt"),
      });
    }
    idx++;
  }
  return chunks;
}

// ----------------------------
// Helper: merge timestamp blocks
// ----------------------------
function mergeTimestampBlocks(
  blocks: any[],
  opts: { maxDurationSec: number; maxChars: number }
) {
  const merged: any[] = [];
  let current: any = null;

  function timeToSec(t: string) {
    const [h, m, s] = t.split(":");
    return (
      parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s.replace(",", "."))
    );
  }

  for (const b of blocks) {
    if (!current) {
      current = { ...b };
      continue;
    }

    const duration = timeToSec(b.end) - timeToSec(current.start);
    const combinedText = current.text + " " + b.text;

    if (duration > opts.maxDurationSec || combinedText.length > opts.maxChars) {
      // push current block and start new one
      merged.push(current);
      current = { ...b };
    } else {
      // merge into current
      current.text = combinedText;
      current.end = b.end; // extend end timestamp
    }
  }

  if (current) merged.push(current);
  return merged;
}
