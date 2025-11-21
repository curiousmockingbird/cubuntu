"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { notifyPlay, registerPlayer } from '../lib/audioManager';

type Props = {
  src: string | null | undefined;
  preload?: 'none' | 'metadata' | 'auto';
  initialRate?: number; // default 1.0
  compact?: boolean;
};

export default function AudioPlayer({ src, preload = 'metadata', initialRate = 1.0, compact = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [buffered, setBuffered] = useState(0); // 0..1
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(initialRate);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const unregister = registerPlayer(a);

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setTime(a.currentTime || 0);
    const onPlay = () => {
      setIsPlaying(true);
      notifyPlay(a);
    };
    const onPause = () => setIsPlaying(false);
    const onProgress = () => {
      try {
        if (a.buffered.length) {
          const end = a.buffered.end(a.buffered.length - 1);
          setBuffered(Math.min(1, end / (a.duration || 1)));
        }
      } catch {}
    };
    const onVolume = () => {
      setVolume(a.volume);
      setMuted(a.muted);
    };
    const onEnded = () => setIsPlaying(false);

    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('durationchange', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('progress', onProgress);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('volumechange', onVolume);
    a.addEventListener('ended', onEnded);

    // init state
    onLoaded();
    onTime();
    onProgress();
    onVolume();

    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('durationchange', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('progress', onProgress);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('volumechange', onVolume);
      a.removeEventListener('ended', onEnded);
      unregister();
    };
  }, [src]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      notifyPlay(a);
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  const seek = (next: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(next, duration || a.duration || 0));
  };

  const onSeekInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = Number(e.target.value);
    setTime(val);
  };
  const onSeekCommit: React.MouseEventHandler<HTMLInputElement> & React.KeyboardEventHandler<HTMLInputElement> = () => {
    seek(time);
  };

  const back = (secs: number) => seek((audioRef.current?.currentTime || 0) - secs);
  const forward = (secs: number) => seek((audioRef.current?.currentTime || 0) + secs);

  const cycleRate = () => {
    const options = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = options.indexOf(rate);
    setRate(options[(idx + 1) % options.length]);
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
  };

  const onVol: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = Number(e.target.value);
    if (a.volume > 0 && a.muted) a.muted = false;
  };

  const fmt = useMemo(() => (n: number) => {
    if (!isFinite(n)) return '0:00';
    const s = Math.max(0, Math.floor(n));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (x: number) => (x < 10 ? `0${x}` : `${x}`);
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }, []);

  if (!src) return null;

  const playedPct = duration ? Math.min(100, (time / duration) * 100) : 0;
  const bufferedPct = duration ? Math.min(100, buffered * 100) : 0;

  return (
    <div className={
      `rounded-lg border border-slate-200 bg-white ${compact ? 'p-2' : 'p-3'}`
    } role="group" aria-label="Audio player">
      <audio ref={audioRef} src={src} preload={preload} />
      {compact ? (
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-blue-600 bg-blue-600 px-2 py-1 text-sm text-white"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          <div className="text-sm text-slate-600 tabular-nums w-12 text-center">{fmt(time)}</div>

          <div className="relative flex flex-1 items-center">
            <div className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded bg-slate-200" style={{ width: `${bufferedPct}%` }} aria-hidden />
            <input
              className="w-full"
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={time}
              onChange={onSeekInput}
              onMouseUp={onSeekCommit}
              onKeyUp={onSeekCommit}
              aria-label="Seek"
            />
          </div>

          <div className="text-sm text-slate-600 tabular-nums w-12 text-center">{fmt(duration)}</div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3">
            <button className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100" onClick={() => back(15)} aria-label="Back 15 seconds">⏪ 15s</button>
            <button className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-white hover:brightness-95" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100" onClick={() => forward(30)} aria-label="Forward 30 seconds">30s ⏩</button>
            <button className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100" onClick={cycleRate} aria-label="Change speed">{rate.toFixed(2)}x</button>
            <div className="flex-1" />
            <button className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 hover:bg-slate-100" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
            <input
              className="w-[110px]"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={onVol}
              aria-label="Volume"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-14 text-center text-slate-500 tabular-nums" aria-label="Elapsed time">{fmt(time)}</div>
            <div className="relative flex h-6 flex-1 items-center">
              <div className="pointer-events-none absolute left-0 top-1/2 h-1 w-0 -translate-y-1/2 rounded bg-slate-200" style={{ width: `${bufferedPct}%` }} aria-hidden />
              <input
                className="w-full"
                type="range"
                min={0}
                max={Math.max(1, duration)}
                step={0.1}
                value={time}
                onChange={onSeekInput}
                onMouseUp={onSeekCommit}
                onKeyUp={onSeekCommit}
                aria-label="Seek"
              />
            </div>
            <div className="w-14 text-center text-slate-500 tabular-nums" aria-label="Total time">{fmt(duration)}</div>
          </div>
        </>
      )}
    </div>
  );
}
