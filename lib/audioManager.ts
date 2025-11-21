// Simple singleton manager to ensure only one HTMLAudioElement plays at a time.
const players = new Set<HTMLAudioElement>();

export function registerPlayer(el: HTMLAudioElement) {
  players.add(el);
  return () => players.delete(el);
}

export function notifyPlay(el: HTMLAudioElement) {
  for (const p of players) {
    if (p !== el && !p.paused) {
      try {
        p.pause();
      } catch {}
    }
  }
}

