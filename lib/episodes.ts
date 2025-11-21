import fs from 'node:fs';
import path from 'node:path';

export type Episode = {
  slug: string;
  title: string;
  date: string; // ISO date string
  duration: string;
  description: string;
  audioUrl: string;
  showNotes?: string[];
};

const EPISODES_DIR = path.join(process.cwd(), 'data', 'episodes');

function readEpisodeFile(filePath: string): Episode | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    return json as Episode;
  } catch {
    return null;
  }
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const files = fs
    .readdirSync(EPISODES_DIR)
    .filter((f) => f.endsWith('.json'));

  const episodes = files
    .map((f) => readEpisodeFile(path.join(EPISODES_DIR, f)))
    .filter((e): e is Episode => !!e)
    // sort by date desc by default
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return episodes;
}

export async function getEpisodeSlugs(): Promise<string[]> {
  const files = fs
    .readdirSync(EPISODES_DIR)
    .filter((f) => f.endsWith('.json'));
  return files.map((f) => f.replace(/\.json$/, ''));
}

export async function getEpisodeBySlug(slug: string): Promise<Episode | null> {
  const file = path.join(EPISODES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return readEpisodeFile(file);
}

