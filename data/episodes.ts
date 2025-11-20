export type Episode = {
  slug: string;
  title: string;
  date: string; // ISO string
  duration: string; // mm:ss or similar
  description: string;
  audioUrl: string;
  showNotes?: string[];
};

export const episodes: Episode[] = [
  {
    slug: 'welcome-to-the-show',
    title: 'Welcome to the Show',
    date: '2024-01-15',
    duration: '08:24',
    description: 'Kickoff episode introducing the podcast, goals, and format.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    showNotes: [
      'In this episode we outline the vision for the podcast.',
      'We also cover what to expect in upcoming episodes.',
    ],
  },
  {
    slug: 'deep-dive-into-mvp',
    title: 'Deep Dive into MVPs',
    date: '2024-02-03',
    duration: '14:02',
    description: 'What makes a good MVP? Scope, speed, and validation.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    showNotes: [
      'Discussed the importance of focusing on core value.',
      'Shared tips for prioritizing features and collecting feedback.',
    ],
  },
];

