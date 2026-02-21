# Podcast MVP — Documentation

This document provides a concise overview of the repository: what it is, how it’s structured, how to run it locally, and where key features live.

## Overview

- Minimal podcast site built with Next.js App Router, TypeScript, and Tailwind.
- Lists episodes from local JSON, plays audio in-browser, and exposes an RSS feed.
- Includes authentication (email/password, Google), Prisma/PostgreSQL, and real‑time comments via Pusher.

## Tech Stack

- Framework: Next.js (App Router), React, TypeScript
- Styling: Tailwind CSS v4 (tokens in `app/globals.css`, config in `tailwind.config.ts`)
- Auth: NextAuth/Auth.js with Prisma adapter and Credentials + Google providers
- DB/ORM: Prisma with PostgreSQL (`prisma/schema.prisma`)
- Realtime: Pusher Channels for live comment updates
- Data fetching: TanStack Query (client-side) for the comments UI

## Project Structure

- `app/` — Routes, layouts, and metadata
  - `layout.tsx` — Global layout, site metadata
  - `page.tsx` — Episode list with embedded players
  - `episodes/[slug]/page.tsx` — Episode detail page + comments panel
  - `api/` — Route handlers: RSS, auth (signin/verify/forgot/reset), register, comments, users
  - `sitemap.ts`, `manifest.webmanifest` — SEO and PWA
- `components/` — UI components (audio player, comments, auth intake, nav/header/footer)
- `lib/` — Episodes loader, Prisma client, NextAuth config, Pusher, mailer, audio manager
- `data/episodes/` — Episode content in JSON files
- `prisma/` — Prisma schema and migrations config
- `public/` — Static assets (images, audio)
- `README.md` — Quickstart and feature overview

## Key Features & Flows

### Episodes

- Source: `data/episodes/*.json` with fields like `slug`, `title`, `date`, `description`, `audioUrl`, `image`, `showNotes`.
- List page (`app/page.tsx`) shows all episodes and duration via a lightweight `AudioDuration` probe.
- Detail page (`app/episodes/[slug]/page.tsx`) shows cover, player, notes, and the comments panel.
- RSS feed: `GET /api/rss` builds a podcast RSS from the same JSON data.

### Audio

- Player component: `components/AudioPlayer.tsx` uses `react-h5-audio-player`.
- Adds a speed control and integrates a singleton audio manager (`lib/audioManager.ts`) to pause other tracks when one starts playing.

### Authentication

- NextAuth config in `lib/auth.ts` (JWT sessions; Prisma adapter; Credentials + Google providers).
- Onboarding UI: `components/AuthIntake.tsx` checks if email exists, then shows password form or signup form.
- Email verification for signup:
  - `POST /api/auth/register-initiate` — sends verification link to `/verify`
  - `POST /api/auth/register-verify` — creates the user and issues a one-time login token
- Password reset:
  - `POST /api/auth/forgot` — sends reset link to `/reset`
  - `POST /api/auth/reset` — sets new password

### Comments

- API: `app/api/comments/route.ts` supports listing top-level comments (with nested replies) and creating new comments/replies.
- Model: threaded `Comment` with a self-relation in Prisma.
- UI: `components/Comments.tsx` side panel with optimistic updates and real-time updates via a Pusher channel (`comments-{slug}`).

### SEO & PWA

- `app/sitemap.ts` exports a dynamic sitemap including episode pages.
- `app/manifest.webmanifest` includes basic PWA metadata.
- Site metadata and RSS alternate are set in `app/layout.tsx`.

## Configuration (Environment Variables)

Set these in `.env` (see `.env.example`), based on the code paths:

- Auth
  - `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- Database
  - `DATABASE_URL`
- Google OAuth (optional)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Pusher (for live comments)
  - `PUSHER_APP_ID`
  - `PUSHER_SECRET`
  - `NEXT_PUBLIC_PUSHER_KEY`
  - `NEXT_PUBLIC_PUSHER_CLUSTER`
- Email (Resend) for verification and password reset
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` (e.g., `Podcast <no-reply@yourdomain.com>`) 
- Site URL (canonical, RSS)
  - `SITE_URL` or `NEXT_PUBLIC_SITE_URL`

## Running Locally

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - Create `.env` with the keys above (at minimum `DATABASE_URL`, `AUTH_SECRET`).
3. Prepare database:
   - `npx prisma migrate dev`
   - `npx prisma generate`
4. Start the dev server:
   - `npm run dev`
5. Open the app:
   - `http://localhost:3000`

## Content Management

- Add an episode by creating a new JSON file under `data/episodes/` matching the existing examples.
- Put audio under `public/audio/` or set `audioUrl` to an absolute URL; images can use Cloudinary (allowed by `next.config.mjs`).

## Notable Files

- Episodes loader: `lib/episodes.ts`
- RSS: `app/api/rss/route.ts`
- Comments API: `app/api/comments/route.ts`
- Auth config: `lib/auth.ts`
- Auth flows: `app/api/auth/*`, pages `/auth`, `/verify`, `/forgot`, `/reset`
- Audio player: `components/AudioPlayer.tsx`
- Comments UI: `components/Comments.tsx`

## Notes & Follow-ups

- A legacy `auth.ts` exists at the repo root, but the live NextAuth config is in `lib/auth.ts` with its route in `app/api/auth/[...nextauth]/route.ts`. Consider removing or updating the root file to avoid confusion.
- Update `.env.example` with all environment keys if you want a complete template for contributors.
- Replace placeholder links/content for social and donate pages; update branding as desired.

