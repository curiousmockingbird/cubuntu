import fs from 'node:fs';
import path from 'node:path';

import { getAllEpisodes } from './episodes';

type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  date: string;
  text: string;
};

export type SearchHit = {
  slug: string;
  title: string;
  date: string;
  score: number;
  snippet: string;
};

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

type PersistedEmbeddingIndex = {
  model: string;
  updatedAt: string;
  items: Record<string, number[]>;
};

const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';
const ANSWER_MODEL = process.env.AI_ANSWER_MODEL || 'gpt-4o-mini';
const CACHE_TTL_MS = 30 * 60 * 1000;
const EMBEDDING_INDEX_FILE = path.join(process.cwd(), 'data', 'ai-embedding-index.json');

const embeddingCache = new Map<string, { value: number[]; expiresAt: number }>();
let fileIndexLoaded = false;
let fileIndexDirty = false;

function detectQuestionLanguage(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return 'English';

  const spanishMarkers = ['¿', '¡', 'ñ', 'á', 'é', 'í', 'ó', 'ú', ' el ', ' la ', ' de ', ' que ', ' y '];
  const englishMarkers = [' the ', ' and ', ' what ', ' how ', ' is ', ' are ', ' in '];

  const normalized = ` ${q} `;
  const spanishScore = spanishMarkers.reduce((acc, marker) => acc + (normalized.includes(marker) ? 1 : 0), 0);
  const englishScore = englishMarkers.reduce((acc, marker) => acc + (normalized.includes(marker) ? 1 : 0), 0);

  if (spanishScore > englishScore) return 'Spanish';
  if (englishScore > spanishScore) return 'English';
  return 'the same language as the user question';
}

function toChunks(input: string, chunkSize = 800): string[] {
  const text = input.replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function makeDocuments(episodes: Awaited<ReturnType<typeof getAllEpisodes>>): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const ep of episodes) {
    const source = [ep.title, ep.description, ...(ep.showNotes || [])].join('\n\n');
    const chunks = toChunks(source);
    chunks.forEach((chunk, idx) => {
      docs.push({
        id: `${ep.slug}::${idx}`,
        slug: ep.slug,
        title: ep.title,
        date: ep.date,
        text: chunk,
      });
    });
  }
  return docs;
}

function loadEmbeddingIndexFromDisk(): void {
  if (fileIndexLoaded) return;
  fileIndexLoaded = true;
  if (!fs.existsSync(EMBEDDING_INDEX_FILE)) return;

  try {
    const raw = fs.readFileSync(EMBEDDING_INDEX_FILE, 'utf8');
    const parsed = JSON.parse(raw) as PersistedEmbeddingIndex;
    if (!parsed || parsed.model !== EMBEDDING_MODEL || !parsed.items) return;

    const now = Date.now();
    Object.entries(parsed.items).forEach(([text, value]) => {
      if (!Array.isArray(value) || value.length === 0) return;
      embeddingCache.set(text, { value, expiresAt: now + CACHE_TTL_MS });
    });
  } catch {
    // ignore malformed embedding index and rebuild lazily
  }
}

function saveEmbeddingIndexToDisk(): void {
  if (!fileIndexDirty) return;

  const items: Record<string, number[]> = {};
  embeddingCache.forEach((entry, text) => {
    if (entry.value.length > 0) {
      items[text] = entry.value;
    }
  });

  const payload: PersistedEmbeddingIndex = {
    model: EMBEDDING_MODEL,
    updatedAt: new Date().toISOString(),
    items,
  };

  const dir = path.dirname(EMBEDDING_INDEX_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(EMBEDDING_INDEX_FILE, JSON.stringify(payload));
  fileIndexDirty = false;
}

function promoteCachedEmbeddings(texts: string[]): void {
  const now = Date.now();
  texts.forEach((text) => {
    const found = embeddingCache.get(text);
    if (!found || found.value.length === 0) return;
    found.expiresAt = now + CACHE_TTL_MS;
    embeddingCache.set(text, found);
  });
}

async function fetchEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  loadEmbeddingIndexFromDisk();
  promoteCachedEmbeddings(texts);

  const now = Date.now();
  const uncached = texts.filter((t) => {
    const found = embeddingCache.get(t);
    return !found || found.expiresAt <= now;
  });

  if (uncached.length > 0) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: uncached,
      }),
      cache: 'no-store',
    });
    const json = (await res.json()) as OpenAIEmbeddingResponse;
    if (!res.ok || !json.data) {
      const reason = json.error?.message || 'Failed to get embeddings';
      throw new Error(reason);
    }
    for (let i = 0; i < uncached.length; i += 1) {
      const text = uncached[i];
      const embedding = json.data[i]?.embedding;
      if (!embedding) continue;
      embeddingCache.set(text, { value: embedding, expiresAt: now + CACHE_TTL_MS });
      fileIndexDirty = true;
    }
    saveEmbeddingIndexToDisk();
  }

  return texts.map((t) => embeddingCache.get(t)?.value || []);
}

function simpleFallbackSearch(query: string, docs: SearchDocument[], topK: number): SearchHit[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const scored = docs
    .map((d) => {
      const hay = `${d.title}\n${d.text}`.toLowerCase();
      const hits = tokens.reduce((acc, token) => acc + (hay.includes(token) ? 1 : 0), 0);
      const score = tokens.length > 0 ? hits / tokens.length : 0;
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ d, score }) => ({
    slug: d.slug,
    title: d.title,
    date: d.date,
    score,
    snippet: d.text.slice(0, 280),
  }));
}

export async function searchEpisodes(query: string, topK = 5): Promise<{ mode: 'ai' | 'fallback'; hits: SearchHit[] }> {
  const q = query.trim();
  if (!q) return { mode: 'fallback', hits: [] };

  const episodes = await getAllEpisodes();
  const docs = makeDocuments(episodes);
  if (docs.length === 0) return { mode: 'fallback', hits: [] };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { mode: 'fallback', hits: simpleFallbackSearch(q, docs, topK) };
  }

  const allTexts = [q, ...docs.map((d) => d.text)];
  const vectors = await fetchEmbeddings(allTexts, apiKey);
  const queryVec = vectors[0];
  const docVecs = vectors.slice(1);

  const ranked = docs
    .map((doc, idx) => ({
      doc,
      score: cosineSimilarity(queryVec, docVecs[idx] || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc, score }) => ({
      slug: doc.slug,
      title: doc.title,
      date: doc.date,
      score,
      snippet: doc.text.slice(0, 280),
    }));

  return { mode: 'ai', hits: ranked };
}

export async function generateGroundedAnswer(query: string, hits: SearchHit[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || hits.length === 0) return null;
  const responseLanguage = detectQuestionLanguage(query);

  const context = hits
    .map(
      (h, idx) =>
        `Source ${idx + 1}\nTitle: ${h.title}\nSlug: ${h.slug}\nDate: ${h.date}\nSnippet: ${h.snippet}`,
    )
    .join('\n\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ANSWER_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a podcast search assistant. Only answer using the provided sources. If insufficient info, say so briefly. You must respond only in the requested answer language.',
        },
        {
          role: 'user',
          content:
            `Question: ${query}\n\n` +
            `Answer language: ${responseLanguage}\n\n` +
            `Sources:\n${context}\n\n` +
            'Return a concise answer and cite source numbers in brackets like [1]. Never switch to another language.',
        },
      ],
    }),
    cache: 'no-store',
  });

  const json = (await res.json()) as OpenAIChatResponse;
  if (!res.ok) return null;
  return json.choices?.[0]?.message?.content?.trim() || null;
}
