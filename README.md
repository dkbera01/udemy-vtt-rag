# Udemy VTT RAG (Next.js 15)

A Retrieval-Augmented Generation (RAG) application that ingests `.vtt` transcripts from Udemy lectures, stores vector embeddings in **Qdrant Cloud**, and answers questions with precise **timestamps** and **lecture titles**.

---

## Features

* Ingests `.vtt` transcript files and splits them into \~2-minute chunks.
* Stores embeddings of chunks in **Qdrant Cloud**.
* Uses OpenAI embeddings (`text-embedding-3-small`, 1536 dimensions).
* Provides answers with **timestamps** and **lecture IDs** for accurate referencing.
* Built with **Next.js 15**.

---

## Quickstart

```bash
# Install dependencies
pnpm install  # or npm install / yarn

# Copy example environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

Open the app in your browser: [http://localhost:3000/chat](http://localhost:3000/chat)

---

## Usage

* Place your Udemy `.vtt` files in the `data/vtt` directory.
* Run the ingestion script:

```bash
npm run ingest
```

* The script will:

  1. Parse all `.vtt` files.
  2. Split transcripts into \~60-second chunks.
  3. Generate embeddings.
  4. Upsert embeddings to Qdrant Cloud.

* You can then query your transcripts through the chat interface and get answers with timestamps and lecture references.

---

## Environment Variables

Make sure to configure the following in your `.env.local`:

```
OPENAI_API_KEY=your_openai_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

---

## Notes

* The app leverages **OpenAI Embeddings** (`text-embedding-3-small`) for semantic search.
* The RAG pipeline ensures answers are contextually accurate and reference the **exact lecture timestamp**.
* Designed for Udemy course transcripts but can be adapted for other `.vtt` sources.

---