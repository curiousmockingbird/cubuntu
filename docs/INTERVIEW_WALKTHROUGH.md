# Cubuntu Interview Walkthrough (Feature-Centered)

This guide is a practical script to walk an interviewer through the project by focusing on six core features and the engineering choices behind each one.

## 1) Opening (60–90 seconds)

Use this framing:

- **What this app is:** a Next.js podcast platform with structured episode content, streaming audio, auth, community interaction, and AI-assisted discovery.
- **Architecture at a glance:**
  - **UI + routing:** Next.js App Router (`app/`)
  - **Content layer:** file-based episode JSON (`data/episodes`) loaded server-side
  - **Database layer:** Prisma + PostgreSQL for users/comments/tokens
  - **Realtime layer:** Pusher for comment fan-out
  - **AI layer:** retrieval over episode content + optional grounded answer generation
- **Pitch:** “I optimized for fast iteration on content and product features without introducing CMS overhead too early.”

---

## 2) Suggested Demo Flow (8–12 minutes)

1. Home page: show episode listing and audio controls.
2. Episode page: show show notes + comments drawer.
3. Auth flow: explain register/login and secure comment posting.
4. RSS endpoint: quickly show `/api/rss` and point out it is generated from the same source data.
5. AI search: run a question in “Ask the AI” and explain retrieval + grounded answering.

---

## 3) The Six Key Features (your core narrative)

## Feature 1 — File-based content model + Git LFS

### What to say
- Episodes are stored as one JSON file per episode in `data/episodes/`.
- A server utility loads files, applies filtering for disabled episodes, and sorts by publish date.
- Audio files are tracked with Git LFS so the repository stays light and clone/fetch operations remain manageable as media grows.

### Why this design is strong
- **Simple editorial workflow:** adding an episode is a PR-friendly file operation.
- **Strong versioning:** content changes are inherently reviewed in Git history.
- **Low operational complexity:** no CMS dependency needed for early-stage velocity.
- **Media scalability:** LFS keeps large binaries out of normal Git object storage.

### Key implementation references
- Episode loading/filtering/sorting: `lib/episodes.ts`
- Content files: `data/episodes/*.json`
- LFS rules: `.gitattributes`

### Tradeoff you can mention
- File-based models are excellent early on, but eventually a CMS/admin pipeline may be better for non-technical editors and larger teams.

---

## Feature 2 — RSS feed

### What to say
- The RSS feed is generated at `GET /api/rss`.
- It reuses the same episode source data as the web UI, reducing data drift.
- The feed builder escapes XML, normalizes URLs, and strips lightweight inline formatting markers.

### Why this design is strong
- **Single source of truth** for web and syndication.
- **Portable distribution:** users can subscribe from any podcast-compatible client.
- **SEO/discoverability boost** through standardized feed metadata.

### Key implementation references
- RSS route: `app/api/rss/route.ts`
- Episode source: `lib/episodes.ts`

### Tradeoff you can mention
- For advanced podcast ecosystems, you might add iTunes/Podcast 2.0-specific metadata extensions.

---

## Feature 3 — Authentication

### What to say
- Auth is implemented with Auth.js/NextAuth and Prisma adapter.
- Supports both credentials-based sign-in (email/password) and Google OAuth.
- Includes full lifecycle flows: registration verification and password reset through dedicated API endpoints.

### Why this design is strong
- **Production-grade baseline** with mature auth framework patterns.
- **Provider flexibility:** social + local auth in one system.
- **Secure handling:** password hashes, tokenized verification/reset flows, and server-side checks for protected actions.

### Key implementation references
- Core auth config/providers/callbacks: `lib/auth.ts`
- Auth route handler: `app/api/auth/[...nextauth]/route.ts`
- Verification/reset flow routes:
  - `app/api/auth/register-initiate/route.ts`
  - `app/api/auth/register-verify/route.ts`
  - `app/api/auth/forgot/route.ts`
  - `app/api/auth/reset/route.ts`
- Data model: `prisma/schema.prisma`

### Tradeoff you can mention
- Email deliverability and OAuth setup add ops overhead; worth it for user trust and account recovery UX.

---

## Feature 4 — Live comments

### What to say
- Comments are persisted in Prisma with a threaded model (top-level + replies).
- Only authenticated users can post comments.
- The UI uses TanStack Query for fetching/mutations and optimistic updates.
- Real-time fan-out is done through Pusher channels scoped by episode slug.

### Why this design is strong
- **Immediate UX:** new comments appear in near-real time without manual refresh.
- **Scalable interaction model:** server writes to DB first, then emits best-effort events.
- **Good responsiveness:** optimistic updates keep interface snappy even with latency.

### Key implementation references
- Comments UI/state/realtime subscription: `components/Comments.tsx`
- Comments API and auth check: `app/api/comments/route.ts`
- Pusher server integration: `lib/pusher.ts`
- Comment schema: `prisma/schema.prisma`

### Tradeoff you can mention
- You must reason carefully about consistency between optimistic state and eventual server truth (the code addresses this with invalidation and deduping).

---

## Feature 5 — Global Audio UX

### What to say
- The app provides a **global sticky audio player** via React context so playback can continue while navigating.
- Playback state includes persisted position/rate/volume/mute via `localStorage`.
- There is logic to avoid multiple tracks playing simultaneously.

### Why this design is strong
- **Podcast-native UX:** seamless listening across route changes.
- **State continuity:** listeners can resume naturally.
- **User control:** playback speed and position persistence improve retention.

### Key implementation references
- Global player/context: `components/GlobalAudioProvider.tsx`
- Single-active-player helper: `lib/audioManager.ts`
- Per-episode trigger button integration: `components/PlayEpisodeButton.tsx`

### Tradeoff you can mention
- Browser autoplay policies can be tricky; code handles this with gesture-aware playback attempts and fallback behavior.

---

## Feature 6 — “Ask the AI” (RAG)

### What to say
- The AI layer builds retrieval documents from episode title/description/show notes.
- It chunks content, computes embeddings (when `OPENAI_API_KEY` is present), ranks by cosine similarity, and returns top hits.
- Optionally, it synthesizes a concise grounded answer that cites retrieved sources.
- There is a fallback lexical search mode when embeddings are unavailable.

### Why this design is strong
- **Practical RAG architecture:** retrieval and answer generation are separated.
- **Graceful degradation:** still works locally without external AI credentials.
- **Grounding strategy:** answer generation is instructed to stay within provided context.

### Key implementation references
- Retrieval + embedding + grounded answering: `lib/aiSearch.ts`
- API endpoint surface: `app/api/ai/search/route.ts`
- UI entry point: `components/AISearch.tsx`

### Tradeoff you can mention
- As corpus size grows, precomputed/vector-store indexing can improve latency/cost versus on-demand embedding flows.

---

## 4) Architecture Talking Points (cross-cutting)

- **Shared content source** powers website pages, RSS, and AI retrieval.
- **Progressive complexity:** file-based content first; DB only where relational or user-generated data is needed.
- **Resilience:** fallback paths exist (AI fallback search, best-effort realtime push).
- **Security boundary:** mutating routes enforce session checks.

---

## 5) “Why this matters” Closing (30–45 seconds)

Use this concise ending:

> “The project demonstrates end-to-end product thinking: a maintainable content model, distribution via RSS, secure identity, real-time community features, high-quality media UX, and a pragmatic RAG assistant. Each feature is independently valuable, but together they form a cohesive podcast platform that is both usable now and extensible later.”

---

## 6) Backup Q&A Prep (if interviewer drills deeper)

- **Why JSON files instead of a CMS?**
  - Faster iteration, low ops burden, and Git-native editorial workflows for early product stage.
- **How would you scale comments?**
  - Add pagination, rate limiting, moderation queues, and possibly websocket infra consolidation.
- **How would you improve RAG quality?**
  - Better chunking strategy, richer metadata filters, reranking, and evaluation datasets.
- **How would you productionize audio analytics?**
  - Add event instrumentation (play/pause/seek/completion) and dashboard funnels.

