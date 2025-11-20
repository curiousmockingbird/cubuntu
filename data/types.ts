export type Episode = {
  slug: string;
  title: string;
  date: string; // ISO string
  duration: string; // mm:ss or similar
  description: string;
  audioUrl: string;
  showNotes?: string[];
};

