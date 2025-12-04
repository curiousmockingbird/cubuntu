"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  src: string | null | undefined;
  className?: string;
  fallback?: string; // text to show while loading or on error
};

function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const two = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${two(minutes)}:${two(seconds)}`
    : `${minutes}:${two(seconds)}`;
}

export default function AudioDuration({ src, className, fallback = "--:--" }: Props) {
  const [duration, setDuration] = useState<string | null>(null);

  const resolvedSrc = useMemo(() => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
    return `/${src}`;
  }, [src]);

  useEffect(() => {
    if (!resolvedSrc) {
      setDuration(null);
      return;
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = resolvedSrc;

    const onLoaded = () => {
      setDuration(formatDuration(audio.duration));
    };
    const onError = () => {
      setDuration(null);
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);

    // Kick off loading metadata
    // Some browsers need play() or load(); load() is safe for metadata
    try {
      audio.load();
    } catch {}

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      // Prevent keeping network resources around
      try {
        audio.src = "";
      } catch {}
    };
  }, [resolvedSrc]);

  return <span className={className}>{duration ?? fallback}</span>;
}

