Podcast MVP (Next.js + TypeScript)

Overview
- Minimal podcast website built with Next.js App Router in TypeScript.
- Lists episodes and plays audio directly in the browser using HTML5 `<audio>`.

Features
- Episodes list page with title, date, duration, description.
- Episode detail pages with show notes.
- In-browser audio playback (no extra player library required).

Getting Started
1) Install dependencies:
   - `npm install`
2) Run the dev server:
   - `npm run dev`
3) Open the app:
   - Visit `http://localhost:3000`

Project Structure
- `app/` — App Router pages (TypeScript)
  - `layout.tsx` — global layout and styles import
  - `page.tsx` — episodes list
  - `episodes/[slug]/page.tsx` — episode detail
- `components/AudioPlayer.tsx` — simple HTML5 audio wrapper
- `data/episodes/` — one file per episode as `.json`
- `app/api/rss/route.ts` — RSS feed (TypeScript)
- `app/globals.css` — light styles for layout and cards

Notes
- Sample MP3s are hosted remotely (SoundHelix) and stream in the browser.
- Replace `data/episodes.js` with your own content or wire up a CMS/API.
- If you prefer a richer player UI, consider `react-h5-audio-player`.

Episodes data (JSON)
- Each episode lives in `data/episodes/*.json` and is loaded server-side via `lib/episodes.ts`.
- To add a new episode, create a new JSON file with the same shape as the examples.

Git LFS (for audio)
- This repo tracks audio files with Git LFS via `.gitattributes`.
- Setup locally:
  - Install LFS: `git lfs install`
  - Commit attributes: `git add .gitattributes && git commit -m "chore: enable Git LFS for audio"`
  - Add or re-add audio under `public/audio/` (e.g., `public/audio/episode.mp3`) and commit.
- If audio was already committed without LFS, rewrite history (destructive):
  - `git lfs migrate import --include="*.mp3,*.m4a,*.aac,*.flac,*.wav,*.ogg,*.oga,*.opus,*.aiff,*.aif"`
  - Force-push the branch to remote if needed (be careful on shared repos).
- Verify tracking: `git lfs ls-files`
