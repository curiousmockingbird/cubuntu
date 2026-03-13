"use client";

import { useGlobalAudio } from "./GlobalAudioProvider";

type Props = {
  src: string;
  title?: string;
  image?: string;
  slug?: string;
  compact?: boolean;
};

export default function PlayEpisodeButton({ src, title, image, slug, compact = false }: Props) {
  const audio = useGlobalAudio();

  return (
    <button
      type="button"
      onClick={() => audio.play({ src, title, image, slug })}
      className={compact
        ? "inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        : "inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-red-700"}
      aria-label="Reproducir episodio"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={compact ? "h-4 w-4" : "h-5 w-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z" />
      </svg>
      {compact ? "Reproducir" : "Escuchar ahora"}
    </button>
  );
}

