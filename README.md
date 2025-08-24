# Udemy VTT RAG (Next.js 15)

RAG app that ingests `.vtt` transcripts, stores 1‑minute chunks in **Qdrant Cloud**, and answers questions with **timestamps** and **jump links**.

## Quickstart

```bash
pnpm i # or npm i / yarn
cp .env.example .env.local
# fill OPENAI + QDRANT creds
npm run setup:qdrant
npm run ingest
npm run dev
```

Open http://localhost:3000/chat

## Scripts

- `npm run setup:qdrant` – creates (or recreates) the collection
- `npm run ingest` – parses all `.vtt` under `data/vtt`, chunks ~60s, embeds, upserts to Qdrant

## Data layout
Put files in `data/vtt/*.vtt`. Filenames act as `lecture_id`.

## Notes
- Uses OpenAI Embeddings (`text-embedding-3-small`, 1536 dim).
- Two-pass chat: (1) query rewrite, (2) grounded answer with citations.
- All answers include timestamps and lecture id.
