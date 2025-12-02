"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import H5AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import { notifyPlay, registerPlayer } from "../lib/audioManager";

type Props = {
  src: string | null | undefined;
  preload?: "none" | "metadata" | "auto";
  initialRate?: number; // default 1.0
  compact?: boolean;
};

export default function AudioPlayer({
  src,
  preload = "metadata",
  initialRate = 1.0,
  compact = false,
}: Props) {
  const playerRef = useRef<any>(null);
  const [rate, setRate] = useState(initialRate);

  const resolvedSrc = useMemo(() => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
    return `/${src}`;
  }, [src]);

  // Apply playback rate when it changes
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    el.playbackRate = rate;
  }, [rate]);

  // Register with audio manager and set initial rate on metadata loaded
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    const unregister = registerPlayer(el);
    const onLoaded = () => {
      try {
        el.playbackRate = rate;
      } catch {}
    };
    el.addEventListener("loadedmetadata", onLoaded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc]);

  if (!src) return null;

  const cycleRate = () => {
    const options = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = options.indexOf(rate);
    const next = options[(idx + 1) % options.length];
    setRate(next);
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (el) el.playbackRate = next;
  };

  const speedButton = (
    <button
      key="speed"
      type="button"
      onClick={cycleRate}
      aria-label="Change speed"
      className="text-xs rounded border px-2 py-1 border-red-200 bg-red-50 hover:bg-red-100"
    >
      {rate.toFixed(2)}x
    </button>
  );

  return (
    <div className={`rounded-lg border border-red-200 bg-white ${compact ? "p-2" : "p-3"}`}>
      <H5AudioPlayer
        ref={playerRef}
        src={resolvedSrc}
        preload={preload}
        onPlay={() => {
          const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
          if (el) notifyPlay(el);
        }}
        showJumpControls={!compact}
        layout={compact ? "stacked-reverse" : "stacked"}
        customAdditionalControls={[speedButton]}
        customVolumeControls={compact ? [] : undefined}
        customProgressBarSection={compact ? [RHAP_UI.PROGRESS_BAR] : undefined}
        autoPlayAfterSrcChange={false}
      />
    </div>
  );
}

