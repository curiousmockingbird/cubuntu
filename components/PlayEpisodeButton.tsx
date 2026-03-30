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
  const resolveSrc = (s: string) => (/^https?:\/\//i.test(s) || s.startsWith("/")) ? s : `/${s}`;
  const isCurrent = (() => {
    if (!audio.current) return false;
    if (slug && audio.current.slug) return audio.current.slug === slug;
    if (audio.current.src) return resolveSrc(audio.current.src) === resolveSrc(src);
    return false;
  })();
  const isActivePlaying = isCurrent && audio.isPlaying;
  // const label = isActivePlaying ? "Reproduciendo" : (compact ? "Reproducir" : "Escuchar ahora");
  const className = compact
    ? (isActivePlaying
        ? "inline-flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 h-9 w-9"
        : "inline-flex items-center justify-center rounded-full bg-brand text-white hover:bg-red-700 h-9 w-9")
    : (isActivePlaying
        ? "inline-flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 h-11 w-11"
        : "inline-flex items-center justify-center rounded-full bg-brand text-white hover:bg-red-700 h-11 w-11");

  return (
    <button
      type="button"
      onClick={() => {
        if (isCurrent) {
          audio.toggle();
        } else {
          audio.play({ src, title, image, slug });
        }
      }}
      className={className}
      // aria-label={label}
    >
      {isActivePlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={compact ? "h-4 w-4" : "h-5 w-5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H8v12h2V6zm6 0h-2v12h2V6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={compact ? "h-4 w-4" : "h-5 w-5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z" />
        </svg>
      )}
      {/* {label} */}
    </button>
  );
}
