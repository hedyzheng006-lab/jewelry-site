// Retrieval step of RAG: find the knowledge-base chunks most similar to a question.
//
// Every chunk and the question are turned into vectors, and chunks are ranked by
// cosine similarity. Two ways to make the vectors:
// - "embeddings": dense semantic vectors from Voyage AI (used when VOYAGE_API_KEY is set).
//   Matches meaning, so "my necklace turned dark" finds the tarnish entry.
// - "keywords": TF-IDF sparse vectors computed locally. No API key needed, but only
//   matches shared words. Also the fallback if the embeddings call fails.
// The index lives in memory: with ~30 chunks a vector database is not needed yet.
import { knowledgeBase, type KnowledgeChunk } from "@/lib/knowledge";

export type RetrievalMethod = "embeddings" | "keywords";

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

export interface RetrievalResult {
  method: RetrievalMethod;
  chunks: RetrievedChunk[];
}

const chunkText = (c: KnowledgeChunk) => `${c.title}. ${c.text}`;

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function topK(scores: number[], k: number): RetrievedChunk[] {
  return knowledgeBase
    .map((c, i) => ({ ...c, score: Math.round(scores[i] * 1000) / 1000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ---------- Dense embeddings (Voyage AI) ----------

const VOYAGE_MODEL = "voyage-3.5";

async function embed(texts: string[], inputType: "document" | "query"): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.VOYAGE_API_KEY?.trim()}` },
    body: JSON.stringify({ input: texts, model: VOYAGE_MODEL, input_type: inputType }),
  });
  if (!res.ok) throw new Error(`Voyage embeddings failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// Chunk vectors are computed once per server instance and reused.
let docVectors: Promise<number[][]> | null = null;

async function searchEmbeddings(question: string, k: number): Promise<RetrievedChunk[]> {
  docVectors ??= embed(knowledgeBase.map(chunkText), "document").catch((e) => {
    docVectors = null;
    throw e;
  });
  const [docs, [q]] = await Promise.all([docVectors, embed([question], "query")]);
  return topK(docs.map((d) => cosine(q, d)), k);
}

// ---------- Sparse TF-IDF keywords ----------

const STOPWORDS = new Set(
  "a an the and or but if of to in on at for with by from is are was were be been it its this that these those i me my you your we our do does did can could would should will how what when where which who why not no yes have has had there their they them as so than too very just about into".split(" "),
);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => !STOPWORDS.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

const docTokens = knowledgeBase.map((c) => tokenize(chunkText(c)));
const idf = new Map<string, number>();
for (const tokens of docTokens) for (const t of new Set(tokens)) idf.set(t, (idf.get(t) ?? 0) + 1);
for (const [t, df] of idf) idf.set(t, Math.log(1 + docTokens.length / df));
const vocab = [...idf.keys()];

function tfidf(tokens: string[]): number[] {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return vocab.map((t) => (counts.get(t) ?? 0) * (idf.get(t) ?? 0));
}

const keywordVectors = docTokens.map(tfidf);

function searchKeywords(question: string, k: number): RetrievedChunk[] {
  const q = tfidf(tokenize(question));
  return topK(keywordVectors.map((d) => cosine(q, d)), k);
}

// ---------- Public entry point ----------

export async function retrieve(question: string, k = 4): Promise<RetrievalResult> {
  if (process.env.VOYAGE_API_KEY?.trim()) {
    try {
      return { method: "embeddings", chunks: await searchEmbeddings(question, k) };
    } catch (error) {
      console.error(error);
    }
  }
  return { method: "keywords", chunks: searchKeywords(question, k) };
}
