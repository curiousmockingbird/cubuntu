import fs from 'node:fs';
import path from 'node:path';

export type Episode = {
  slug: string;
  title: string;
  date: string; // ISO date string
  duration: string;
  description: string;
  audioUrl: string;
  image?: string;
  showNotes?: string[];
};

const EPISODES_DIR = path.join(process.cwd(), 'data', 'episodes');
const DISABLED_FILE = path.join(process.cwd(), 'data', 'episodes.disabled.json');

function loadDisabledSet(): Set<string> {
  let disabled: Set<string> = new Set();
  try {
    if (fs.existsSync(DISABLED_FILE)) {
      const raw = fs.readFileSync(DISABLED_FILE, 'utf8');
      const list = JSON.parse(raw) as unknown;
      if (Array.isArray(list)) {
        disabled = new Set(list.filter((s): s is string => typeof s === 'string'));
      }
    }
  } catch {
    // ignore malformed or missing file
  }
  return disabled;
}

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
  // Load optional list of disabled slugs for easy temporary hiding
  const disabled = loadDisabledSet();
  const files = fs
    .readdirSync(EPISODES_DIR)
    .filter((f) => f.endsWith('.json'));

  const episodes = files
    .map((f) => readEpisodeFile(path.join(EPISODES_DIR, f)))
    .filter((e): e is Episode => !!e)
    // filter out disabled slugs
    .filter((e) => !disabled.has(e.slug))
    // sort by date desc by default
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return episodes;
}

export async function getEpisodeSlugs(): Promise<string[]> {
  const disabled = loadDisabledSet();
  const files = fs
    .readdirSync(EPISODES_DIR)
    .filter((f) => f.endsWith('.json'));
  return files
    .map((f) => f.replace(/\.json$/, ''))
    .filter((slug) => !disabled.has(slug));
}

export async function getEpisodeBySlug(slug: string): Promise<Episode | null> {
  const disabled = loadDisabledSet();
  if (disabled.has(slug)) return null;
  const file = path.join(EPISODES_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return readEpisodeFile(file);
}
