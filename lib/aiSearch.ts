import { getAllEpisodes } from './episodes';
import { createHash } from 'crypto';

type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  date: string;
  text: string;
};

type IndexedDocument = SearchDocument & {
  embedding: number[];
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

const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';
const ANSWER_MODEL = process.env.AI_ANSWER_MODEL || 'gpt-4o-mini';
const CACHE_TTL_MS = 30 * 60 * 1000;

const embeddingCache = new Map<string, { value: number[]; expiresAt: number }>();
let indexedStore: { signature: string; docs: IndexedDocument[] } | null = null;

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

function makeEpisodeSignature(episodes: Awaited<ReturnType<typeof getAllEpisodes>>): string {
  const fingerprint = episodes
    .map((ep) => ({
      slug: ep.slug,
      title: ep.title,
      date: ep.date,
      description: ep.description,
      showNotes: ep.showNotes || [],
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}

async function fetchEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
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
    }
  }

  return texts.map((t) => embeddingCache.get(t)?.value || []);
}

async function ensureDocumentIndex(
  episodes: Awaited<ReturnType<typeof getAllEpisodes>>,
  apiKey: string,
): Promise<IndexedDocument[]> {
  const signature = makeEpisodeSignature(episodes);
  if (indexedStore && indexedStore.signature === signature) {
    return indexedStore.docs;
  }

  const docs = makeDocuments(episodes);
  if (docs.length === 0) {
    indexedStore = { signature, docs: [] };
    return [];
  }

  const vectors = await fetchEmbeddings(
    docs.map((d) => d.text),
    apiKey,
  );

  const indexedDocs = docs.map((doc, idx) => ({
    ...doc,
    embedding: vectors[idx] || [],
  }));

  indexedStore = { signature, docs: indexedDocs };
  return indexedDocs;
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

  const indexedDocs = await ensureDocumentIndex(episodes, apiKey);
  const [queryVec] = await fetchEmbeddings([q], apiKey);

  const ranked = indexedDocs
    .map((doc) => ({
      doc,
      score: cosineSimilarity(queryVec || [], doc.embedding),
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
