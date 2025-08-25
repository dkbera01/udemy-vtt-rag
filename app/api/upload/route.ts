import { NextResponse } from "next/server";
import JSZip from "jszip";
import { ingestVTTBuffer } from "@/lib/ingestVTTBuffer";
import { QdrantClient } from "@qdrant/js-client-rest";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION = process.env.QDRANT_COLLECTION || "udemy_transcripts";
const VECTOR_SIZE = parseInt(process.env.QDRANT_VECTOR_SIZE || "1536", 10);

export async function POST(req: Request) {
  const maxRequestBodySize = 5 * 1024 * 1024; // 5MB
  const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

  // Ensure collection exists
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
      (c: any) => c.name === COLLECTION
    );
    if (!exists) {
      await qdrant.createCollection(COLLECTION, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
    }
  } catch (err) {
    console.error("Error ensuring Qdrant collection:", err);
    return NextResponse.json(
      { error: "Failed to ensure Qdrant collection" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > maxRequestBodySize) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const vttFiles = Object.values(zip.files).filter((f) =>
      f.name.endsWith(".vtt")
    );

    if (vttFiles.length === 0) {
      return NextResponse.json(
        { error: "No .vtt files found in zip" },
        { status: 400 }
      );
    }

    await Promise.all(
      vttFiles.map(async (entry) => {
        try {
          const vttBuffer = Buffer.from(await entry.async("uint8array"));
          await ingestVTTBuffer(vttBuffer, entry.name);
        } catch (err) {
          console.error(`Failed to ingest ${entry.name}:`, err);
        }
      })
    );

    return NextResponse.json({ success: true, count: vttFiles.length });
  } catch (e) {
    console.error("Upload handler error:", e);
    return NextResponse.json(
      { error: "Server error while processing files" },
      { status: 500 }
    );
  }
}
