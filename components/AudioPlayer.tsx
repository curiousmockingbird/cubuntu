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
  const restoredRef = useRef(false);
  const cancelRestoreRef = useRef(false);

  const resolvedSrc = useMemo(() => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
    return `/${src}`;
  }, [src]);

  const storageKey = useMemo(
    () => (resolvedSrc ? `audio:pos:${resolvedSrc}` : undefined),
    [resolvedSrc]
  );
  const RATE_KEY = "audio:rate";
  const VOL_KEY = "audio:vol";
  const MUTED_KEY = "audio:muted";

  // Apply playback rate when it changes
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    el.playbackRate = rate;
    // Persist preferred rate
    try {
      if (typeof window !== "undefined")
        localStorage.setItem(RATE_KEY, String(rate));
    } catch {}
  }, [rate]);

  // Load saved playback rate on mount
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(RATE_KEY);
      const saved = raw ? parseFloat(raw) : NaN;
      if (!Number.isNaN(saved) && saved > 0) setRate(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register with audio manager, set initial rate, and restore saved position/volume
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    const unregister = registerPlayer(el);
    const restorePosition = () => {
      try {
        if (cancelRestoreRef.current) return;
        if (!storageKey || typeof window === "undefined") return;
        const raw = localStorage.getItem(storageKey);
        const saved = raw ? parseFloat(raw) : NaN;
        if (!Number.isNaN(saved) && saved > 0 && isFinite(saved)) {
          // If duration known, clamp within range (keep 1s headroom)
          const dur = el.duration;
          const maxSeek = isFinite(dur) && dur > 1 ? Math.max(0, dur - 1) : undefined;
          const target = maxSeek ? Math.min(saved, maxSeek) : saved;
          if (!Number.isNaN(target) && isFinite(target)) {
            el.currentTime = target;
            restoredRef.current = true;
          }
        }
      } catch {}
    };
    const onLoaded = () => {
      try {
        el.playbackRate = rate;
        // Restore saved playback position (robustly)
        restorePosition();
        // Restore volume and mute state
        if (typeof window !== "undefined") {
          const vRaw = localStorage.getItem(VOL_KEY);
          const mRaw = localStorage.getItem(MUTED_KEY);
          const v = vRaw ? parseFloat(vRaw) : NaN;
          if (!Number.isNaN(v)) el.volume = Math.min(1, Math.max(0, v));
          if (mRaw != null) el.muted = mRaw === "1" || mRaw === "true";
        }
      } catch {}
    };
    const onTimeUpdate = () => {
      try {
        if (!storageKey || typeof window === "undefined") return;
        const t = el.currentTime;
        if (isFinite(t)) localStorage.setItem(storageKey, String(t));
      } catch {}
    };
    const onEnded = () => {
      try {
        if (!storageKey || typeof window === "undefined") return;
        localStorage.removeItem(storageKey);
      } catch {}
    };
    const onVolume = () => {
      try {
        if (typeof window === "undefined") return;
        localStorage.setItem(VOL_KEY, String(el.volume));
        localStorage.setItem(MUTED_KEY, el.muted ? "1" : "0");
      } catch {}
    };
    el.addEventListener("loadedmetadata", onLoaded);
    // Some browsers/components may update time after loadedmetadata; ensure we try again once.
    el.addEventListener("canplay", restorePosition, { once: true } as any);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    el.addEventListener("volumechange", onVolume);
    // If metadata already available, attempt immediate restore
    if (el.readyState >= 1) restorePosition();
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("canplay", restorePosition as any);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("volumechange", onVolume);
      unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc, storageKey]);

  if (!src) return null;

  const cycleRate = () => {
    const options = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = options.indexOf(rate);
    const next = options[(idx + 1) % options.length];
    setRate(next);
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (el) el.playbackRate = next;
    try {
      if (typeof window !== "undefined")
        localStorage.setItem(RATE_KEY, String(next));
    } catch {}
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
    <div
      className={`custom-rhap rounded-lg border border-red-200 bg-white ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <H5AudioPlayer
        ref={playerRef}
        src={resolvedSrc}
        preload={preload}
        onPlay={() => {
          const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
          if (!el) return;
          notifyPlay(el);
          // Ensure not muted/silent when user intends to play
          try {
            if (el.muted || el.volume === 0) {
              el.muted = false;
              if (el.volume === 0) el.volume = 1;
            }
          } catch {}
          // Fallback: if starting from a resumed position causes stall (e.g., no byte-range support),
          // retry from 0 after a short delay if we never reach 'playing'.
          let cleared = false;
          const clear = () => {
            if (cleared) return; cleared = true; try { el.removeEventListener('playing', clear); } catch {}
          };
          el.addEventListener('playing', clear, { once: true });
          const t = setTimeout(() => {
            if (cleared) return;
            clear();
            try {
              if (el.currentTime > 0 && (el.readyState < 2 || el.paused)) {
                cancelRestoreRef.current = true;
                el.currentTime = 0;
                // Best-effort retry; may still require user gesture depending on browser
                const p = el.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
              }
            } catch {}
          }, 1200);
          // Extra safety: clear timeout if component unmounts between now and timeout
          // (handled by one-off nature of setTimeout in event scope)
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
