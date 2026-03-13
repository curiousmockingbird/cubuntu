"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import H5AudioPlayer, { RHAP_UI } from "react-h5-audio-player";

type NowPlaying = {
  src: string;
  title?: string;
  image?: string;
  slug?: string;
};

type AudioContextValue = {
  play: (np: NowPlaying) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setRate: (rate: number) => void;
  isOpen: boolean;
  isPlaying: boolean;
  rate: number;
  current?: NowPlaying | null;
};

const Ctx = createContext<AudioContextValue | undefined>(undefined);

export function useGlobalAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalAudio must be used within GlobalAudioProvider");
  return ctx;
}

export default function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<any>(null);
  const [current, setCurrent] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(undefined);

  const resolveSrc = useCallback((src: string) => {
    if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
    return `/${src}`;
  }, []);

  const POS_KEY = useMemo(() => (audioSrc ? `audio:pos:${audioSrc}` : undefined), [audioSrc]);
  const RATE_KEY = "audio:rate";
  const VOL_KEY = "audio:vol";
  const MUTED_KEY = "audio:muted";

  // Load saved playback rate on mount
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(RATE_KEY);
      const saved = raw ? parseFloat(raw) : NaN;
      if (!Number.isNaN(saved) && saved > 0) setRate(saved);
    } catch {}
  }, []);

  // Apply playback rate when it changes
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    el.playbackRate = rate;
    try {
      if (typeof window !== "undefined") localStorage.setItem(RATE_KEY, String(rate));
    } catch {}
  }, [rate]);

  // Restore position/volume when source changes
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    const restorePosition = () => {
      try {
        if (!POS_KEY || typeof window === "undefined") return;
        const raw = localStorage.getItem(POS_KEY);
        const saved = raw ? parseFloat(raw) : NaN;
        if (!Number.isNaN(saved) && saved > 0 && isFinite(saved)) {
          const dur = el.duration;
          const maxSeek = isFinite(dur) && dur > 1 ? Math.max(0, dur - 1) : undefined;
          el.currentTime = maxSeek ? Math.min(saved, maxSeek) : saved;
        }
      } catch {}
    };
    const onLoaded = () => {
      try {
        el.playbackRate = rate;
        restorePosition();
        // Restore volume + mute
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
        if (!POS_KEY || typeof window === "undefined") return;
        const t = el.currentTime;
        if (isFinite(t)) localStorage.setItem(POS_KEY, String(t));
      } catch {}
    };
    const onEnded = () => {
      setIsPlaying(false);
      try { if (POS_KEY && typeof window !== "undefined") localStorage.removeItem(POS_KEY); } catch {}
    };
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("canplay", restorePosition);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("ended", onEnded);
    if (el.readyState >= 1) restorePosition();
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("canplay", restorePosition);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("ended", onEnded);
    };
  }, [audioSrc, POS_KEY, rate]);

  // Persist volume/mute
  useEffect(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    const onVolume = () => {
      try {
        if (typeof window === "undefined") return;
        localStorage.setItem(VOL_KEY, String(el.volume));
        localStorage.setItem(MUTED_KEY, el.muted ? "1" : "0");
      } catch {}
    };
    el.addEventListener("volumechange", onVolume);
    return () => el.removeEventListener("volumechange", onVolume);
  }, [audioSrc]);

  const play = useCallback((np: NowPlaying) => {
    const url = resolveSrc(np.src);
    // Synchronously mount and update player in the same user gesture
    flushSync(() => {
      setCurrent(np);
      setAudioSrc(url);
    });
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    try {
      const abs = typeof window !== 'undefined' ? new URL(url, window.location.origin).href : url;
      const cur = el.currentSrc || el.src;
      if (!cur || cur !== abs) {
        el.src = abs;
      }
      if (el.muted || el.volume === 0) { el.muted = false; if (el.volume === 0) el.volume = 1; }
      const p = el.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => {});
      setIsPlaying(true);
    } catch {}
  }, [resolveSrc]);

  const pause = useCallback(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    try { el?.pause(); } catch {}
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    try {
      if (el.paused) {
        const p = el.play();
        if (p && typeof (p as any).catch === 'function') (p as any).catch(() => {});
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch {}
  }, []);

  const seek = useCallback((time: number) => {
    const el: HTMLAudioElement | undefined = playerRef.current?.audio?.current;
    if (!el) return;
    try {
      const dur = el.duration;
      const clamped = isFinite(dur) ? Math.max(0, Math.min(time, dur)) : Math.max(0, time);
      el.currentTime = clamped;
    } catch {}
  }, []);

  const value: AudioContextValue = {
    play,
    pause,
    toggle,
    seek,
    setRate,
    isOpen: !!current,
    isPlaying,
    rate,
    current,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Global sticky player */}
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-4xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3">
              {current.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.image} alt="cover" className="h-10 w-10 rounded object-cover border" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{current.title || current.slug || "Reproduciendo"}</div>
                <div className="mt-1">
                  <H5AudioPlayer
                    ref={playerRef}
                    src={audioSrc}
                    preload="metadata"
                    layout="stacked"
                    customVolumeControls={[]}
                    customAdditionalControls={[]}
                    customProgressBarSection={[RHAP_UI.PROGRESS_BAR]}
                    showJumpControls={false}
                    autoPlayAfterSrcChange={false}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              </div>
              {/* <button
                type="button"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
                onClick={toggle}
                className={
                  isPlaying
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white shadow-sm hover:bg-red-700"
                }
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H8v12h2V6zm6 0h-2v12h2V6z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5v14l11-7-11-7z"/></svg>
                )}
              </button> */}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
