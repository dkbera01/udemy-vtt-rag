import { QdrantClient } from "@qdrant/js-client-rest";
import { embed } from "./embeddings";

const QDRANT_URL = process.env.QDRANT_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;
const COLLECTION = process.env.QDRANT_COLLECTION || "udemy_transcripts";

export const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

export type SearchHit = {
  text: string;
  lecture_id: string;
  start: string;
  end: string;
  score: number;
};

export async function retrieve(query: string, topK = 5): Promise<SearchHit[]> {
  const vector = await embed(query);
  const results = await qdrant.search(COLLECTION, {
    vector,
    limit: topK,
    with_payload: true
  });
  return results.map(r => ({
    text: (r.payload as any).text,
    lecture_id: (r.payload as any).lecture_id,
    start: (r.payload as any).start,
    end: (r.payload as any).end,
    score: r.score!
  }));
}
