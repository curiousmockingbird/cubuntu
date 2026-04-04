import { NextRequest, NextResponse } from 'next/server';
import { generateGroundedAnswer, searchEpisodes } from '../../../../lib/aiSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { query?: string; withAnswer?: boolean; topK?: number }
    | null;

  const query = body?.query?.trim() || '';
  const withAnswer = !!body?.withAnswer;
  const topK = Math.min(Math.max(body?.topK || 5, 1), 10);

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const { mode, hits } = await searchEpisodes(query, topK);
    const answer = withAnswer ? await generateGroundedAnswer(query, hits) : null;
    return NextResponse.json({ mode, hits, answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
