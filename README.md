Podcast MVP (Next.js + TypeScript + Tailwind)

Overview
- Minimal podcast website built with Next.js App Router in TypeScript.
- Lists episodes and plays audio directly in the browser using HTML5 `<audio>`.
 - Styled with Tailwind CSS utilities.

Features
- Episodes list page with title, date, duration, description.
- Episode detail pages with show notes.
- In-browser audio playback (no extra player library required).
 - Authentication with Auth.js (NextAuth) + Prisma (email/password via Credentials provider).
 - AI-assisted "Ask the podcast" semantic search with optional grounded answers.

Getting Started
1) Install dependencies:
   - `npm install`
2) Run the dev server:
   - `npm run dev`
3) Open the app:
   - Visit `http://localhost:3000`

Project Structure
- `app/` — App Router pages (TypeScript)
  - `layout.tsx` — layout + Tailwind container
  - `page.tsx` — episodes list (Tailwind two-column cards)
  - `episodes/[slug]/page.tsx` — episode detail (Tailwind two-column)
- `components/AudioPlayer.tsx` — modern player UI (Tailwind)
- `data/episodes/` — one file per episode as `.json`
- `app/api/rss/route.ts` — RSS feed (TypeScript)
- `app/globals.css` — Tailwind layers (@tailwind base/components/utilities)
- `tailwind.config.ts`, `postcss.config.js` — Tailwind setup

Notes
- Sample MP3s are hosted remotely (SoundHelix) and stream in the browser.
- Replace `data/episodes.js` with your own content or wire up a CMS/API.
- If you prefer a richer player UI, consider `react-h5-audio-player`.
 - After adding Tailwind, restart dev server if already running.

Episodes data (JSON)
- Each episode lives in `data/episodes/*.json` and is loaded server-side via `lib/episodes.ts`.
- To add a new episode, create a new JSON file with the same shape as the examples.
 - Inline formatting: you can add simple emphasis inside `title`, `description`, or `showNotes` strings:
   - Bold: `**bold**`
   - Italic: `*italic*` or `_italic_`
   - Underline: `__underline__` (non-standard, supported by the app)
   These render on the website; the RSS feed strips these markers to plain text.

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

Authentication (Auth.js + Prisma)
- Env vars: set `AUTH_SECRET` and `DATABASE_URL` in `.env` (see `.env.example`). To enable Google sign-in, also set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (create credentials at https://console.cloud.google.com/apis/credentials; type: OAuth client ID with authorized redirect `http://localhost:3000/api/auth/callback/google`).
- Run migrations and generate client:
  - `npx prisma migrate dev` (local) or `npx prisma migrate deploy` (CI)
  - `npx prisma generate`
- Routes added:
  - `GET/POST /api/auth/[...nextauth]` — NextAuth handlers
  - Pages: `/login` and `/register`
- Models used in `prisma/schema.prisma`: `User`, `Account`, `Session`, `VerificationToken`, `Comment`.
- The app uses the Prisma Adapter and a Credentials provider (email+password). Passwords are hashed with bcrypt.

AI Search (OpenAI + fallback)
- New route: `POST /api/ai/search` with body `{ query: string, withAnswer?: boolean, topK?: number }`.
- Uses embeddings + cosine similarity when `OPENAI_API_KEY` is set; otherwise falls back to keyword matching.
- Optional answer generation uses a chat model and cites retrieved source snippets.
- Env vars:
  - `OPENAI_API_KEY`
  - `AI_EMBEDDING_MODEL` (optional, default `text-embedding-3-small`)
  - `AI_ANSWER_MODEL` (optional, default `gpt-4o-mini`)
