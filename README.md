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
- `data/episodes.ts` — sample data with remote MP3 URLs
- `app/api/rss/route.ts` — RSS feed (TypeScript)
- `app/globals.css` — light styles for layout and cards

Notes
- Sample MP3s are hosted remotely (SoundHelix) and stream in the browser.
- Replace `data/episodes.js` with your own content or wire up a CMS/API.
- If you prefer a richer player UI, consider `react-h5-audio-player`.
