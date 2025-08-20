import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const upload = multer({ dest: uploadsDir });

const PORT = process.env.PORT || 3001;
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const PDF_COLLECTION = process.env.PDF_COLLECTION || "chaicode-collection";
const WEB_COLLECTION = process.env.WEB_COLLECTION || "chaicode-collection-web";
const WEB_MAX_DEPTH = parseInt(process.env.WEB_MAX_DEPTH || "1", 10);
const WEB_MAX_DOCS = parseInt(process.env.WEB_MAX_DOCS || "50", 10);
const WEB_MAX_CHARS_PER_DOC = parseInt(process.env.WEB_MAX_CHARS || "4000", 10);
const WEB_INCLUDE = (
  process.env.WEB_INCLUDE || "install,download,jdk,setup,getting-started"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Root route
app.get("/", (req, res) => {
  res.send("✅ InsightLM backend is running!");
});

const getEmbeddings = () =>
  new OpenAIEmbeddings({ model: "text-embedding-3-large" });

function formatContext(docs) {
  return (docs || []).map((d, i) => ({
    index: i,
    source_url:
      (d && d.metadata && (d.metadata.source_url || d.metadata.source)) || null,
    page:
      (d && d.metadata && d.metadata.loc && d.metadata.loc.pageNumber) ||
      (d && d.metadata && d.metadata.pageNumber) ||
      null,
    snippet: ((d && d.pageContent) || "").slice(0, 800),
  }));
}

async function upsertDocuments(collectionName, documents) {
  const embeddings = getEmbeddings();
  await QdrantVectorStore.fromDocuments(documents, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName,
  });
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/index/pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pdfPath = req.file.path;
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();

    await upsertDocuments(PDF_COLLECTION, docs);

    // Clean up uploaded file
    fs.unlink(pdfPath, () => {});

    res.json({ success: true, count: docs.length, collection: PDF_COLLECTION });
  } catch (error) {
    console.error("/api/index/pdf error:", error);
    res.status(500).json({ error: "Failed to index PDF" });
  }
});

app.post("/api/index/text", async (req, res) => {
  try {
    const { text, name } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "'text' is required" });
    }

    const doc = new Document({
      pageContent: text,
      metadata: { source: name || "pasted-text" },
    });

    await upsertDocuments(PDF_COLLECTION, [doc]);

    res.json({ success: true, count: 1, collection: PDF_COLLECTION });
  } catch (error) {
    console.error("/api/index/text error:", error);
    res.status(500).json({ error: "Failed to index text" });
  }
});

app.post("/api/index/url", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "'url' is required" });
    }

    let docs = [];
    try {
      const recursive = new RecursiveUrlLoader(url, {
        maxDepth: WEB_MAX_DEPTH,
        timeout: 15000,
        excludeDirs: ["/search", "/signin", "/login"],
        preventOutside: true,
      });
      docs = await recursive.load();
    } catch (_e) {
      const loader = new CheerioWebBaseLoader(url);
      docs = await loader.load();
    }
    // Debug: log raw HTML length if available
    if (docs && docs.length > 0) {
      const firstDoc = docs[0];
      if (firstDoc && typeof firstDoc.pageContent === "string") {
        console.log("🐞 Raw HTML length:", firstDoc.pageContent.length);
      }
    }

    // Guard against excessive token usage by limiting and truncating documents
    const withSources = docs.map((d) => {
      if (!d.metadata) d.metadata = {};
      if (!d.metadata.source_url && d.metadata.source)
        d.metadata.source_url = d.metadata.source;
      return d;
    });

    console.log("🔗 Loaded docs:", docs.length);

    let filtered = withSources.filter(
      (d) => (d?.pageContent || "").trim().length > 0
    );
    console.log("📄 Non-empty docs:", filtered.length);

    const anyInclude = filtered.some((d) => {
      const src = (d.metadata?.source_url || d.metadata?.source || url)
        .toString()
        .toLowerCase();
      return WEB_INCLUDE.some((p) => src.includes(p));
    });

    if (anyInclude) {
      filtered = filtered.filter((d) => {
        const src = (d.metadata?.source_url || d.metadata?.source || url)
          .toString()
          .toLowerCase();
        return WEB_INCLUDE.some((p) => src.includes(p));
      });
      console.log("✅ After include filtering:", filtered.length);
    } else {
      console.log("⚠️ No include keywords matched, keeping all docs.");
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    let splitDocs = [];
    for (const d of filtered.slice(0, WEB_MAX_DOCS)) {
      const docs = await textSplitter.splitDocuments([
        new Document({
          pageContent: d.pageContent || "",
          metadata: {
            ...(d.metadata || {}),
            source_url: d.metadata?.source_url || url,
          },
        }),
      ]);
      splitDocs.push(...docs);
    }

    // Guard clause: if no content extracted, return 400, with debug info
    if (splitDocs.length === 0) {
      console.log("⚠️ No content extracted from URL:", url);
      console.log(
        "🛠 Raw docs:",
        filtered.map((d) => ({
          meta: d.metadata,
          contentPreview: (d.pageContent || "").slice(0, 200),
        }))
      );
      return res.status(400).json({
        error: "No usable content extracted from the provided URL.",
        url,
        debug: {
          loadedDocs: docs.length,
          nonEmpty: filtered.length,
        },
      });
    }

    // Add chunk index
    splitDocs = splitDocs.map((d, i) => {
      d.metadata.chunk = i;
      return d;
    });

    console.log("✅ Saving chunks:", splitDocs.length);
    if (splitDocs.length > 0) {
      console.log("🔎 First chunk:", splitDocs[0].pageContent.slice(0, 200));
    }

    await upsertDocuments(WEB_COLLECTION, splitDocs);

    res.json({
      success: true,
      count: splitDocs.length,
      collection: WEB_COLLECTION,
    });
  } catch (error) {
    console.error("/api/index/url error:", error);
    res.status(500).json({ error: "Failed to index URL" });
  }
});

// Debug endpoints for Qdrant
app.get("/api/debug/collections", async (req, res) => {
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    const collections = await client.getCollections();
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debug/count/:collection", async (req, res) => {
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    const count = await client.count(req.params.collection, { exact: true });
    res.json(count);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "'query' is required" });
    }

    const embeddings = getEmbeddings();

    let relevantChunk = [];
    let relevantWebChunk = [];
    try {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: PDF_COLLECTION,
        }
      );
      relevantChunk = await vectorStore.asRetriever({ k: 10 }).invoke(query);
    } catch {}

    try {
      const vectorWebStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: WEB_COLLECTION,
        }
      );
      relevantWebChunk = await vectorWebStore
        .asRetriever({ k: 10 })
        .invoke(query);
    } catch {}

    console.log("📄 PDF Chunks:", relevantChunk);
    console.log("🌍 Web Chunks:", relevantWebChunk);

    const contextDocs = formatContext(relevantChunk);
    const contextWeb = formatContext(relevantWebChunk);

    if (contextDocs.length === 0 && contextWeb.length === 0) {
      return res.json({
        answer: "I couldn't find this in the uploaded sources.",
        sources: { docs: [], web: [] },
      });
    }

    const SYSTEM_PROMPT = `You are an AI assistant who must answer strictly and only from the provided context (uploaded PDFs and the indexed URLs). If the answer is not present in the context, reply exactly with: "I couldn't find this in the uploaded sources." Include page numbers or source URLs when available.

CONTEXT_START
PDF_DOCS:
${JSON.stringify(contextDocs)}
WEB_DOCS:
${JSON.stringify(contextWeb)}
CONTEXT_END`;

    const client = new OpenAI();
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    const answer = response.choices?.[0]?.message?.content || "";
    res.json({
      answer,
      sources: { docs: relevantChunk, web: relevantWebChunk },
    });
  } catch (error) {
    console.error("/api/chat error:", error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

app.post("/api/chat/stream", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "'query' is required" });
    }

    const embeddings = getEmbeddings();

    let relevantChunk = [];
    let relevantWebChunk = [];
    try {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: PDF_COLLECTION,
        }
      );
      relevantChunk = await vectorStore.asRetriever({ k: 10 }).invoke(query);
    } catch {}

    try {
      const vectorWebStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: WEB_COLLECTION,
        }
      );
      relevantWebChunk = await vectorWebStore
        .asRetriever({ k: 10 })
        .invoke(query);
    } catch {}

    console.log("📄 PDF Chunks (stream):", relevantChunk);
    console.log("🌍 Web Chunks (stream):", relevantWebChunk);

    const contextDocs = formatContext(relevantChunk);
    const contextWeb = formatContext(relevantWebChunk);

    if (contextDocs.length === 0 && contextWeb.length === 0) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write(": connected\n\n");
      const notFoundMsg = "I couldn't find this in the uploaded sources.";
      res.write(`data: ${JSON.stringify({ token: notFoundMsg })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    const SYSTEM_PROMPT = `You are an AI assistant who must answer strictly and only from the provided context (uploaded PDFs and the indexed URLs). If the answer is not present in the context, reply exactly with: "I couldn't find this in the uploaded sources." Include page numbers or source URLs when available.

CONTEXT_START
PDF_DOCS:
${JSON.stringify(contextDocs)}
WEB_DOCS:
${JSON.stringify(contextWeb)}
CONTEXT_END`;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");

    const client = new OpenAI();
    let stream;
    try {
      stream = await client.chat.completions.create({
        model: "gpt-4.1",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
      });
    } catch (e) {
      res.write(
        `data: ${JSON.stringify({ error: "openai_stream_init_failed" })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    try {
      for await (const part of stream) {
        const delta = part?.choices?.[0]?.delta?.content || "";
        if (delta) {
          res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
        }
      }
    } catch (e) {
      // ignore and end below
    }
    // send sources at the end
    res.write(
      `data: ${JSON.stringify({
        done: true,
        sources: { docs: relevantChunk, web: relevantWebChunk },
      })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("/api/chat/stream error:", error);
    try {
      res.write(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`);
    } catch {}
    res.end();
  }
});

app.post("/api/summarize/stream", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "'text' is required" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");

    const client = new OpenAI();
    const stream = await client.chat.completions.create({
      model: "gpt-4.1",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Summarize the provided content into a concise, well-structured Markdown summary. Use a short title and 5-8 bullet points. Do NOT repeat large chunks verbatim; only summarize.",
        },
        { role: "user", content: text },
      ],
    });

    try {
      for await (const part of stream) {
        const delta = part?.choices?.[0]?.delta?.content || "";
        if (delta) res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
      }
    } catch {}
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("/api/summarize/stream error:", error);
    try {
      res.write(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`);
    } catch {}
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server listening on port ${PORT}`);
});
