# Personal AI Assistant

A single-user Next.js dashboard that pulls your day into one place — Google
Calendar, Google Drive notes, tasks and deadlines — with a Gemini-powered AI
layer on top that turns notes into workflows, tracks your progress, suggests
daily ideas, and digests the news.

## Features

- **Google sign-in** — one account, with Calendar and Drive access
- **Calendar** — view and quick-add events, synced with your real Google Calendar
- **Notes** — stored as files in a dedicated Google Drive folder
- **Tasks & deadlines** — with optional auto-sync to Calendar, grouped by week for semester planning
- **AI layer (Gemini)**
  - turn a note into a step-by-step workflow
  - analyze your last 7 days of tasks
  - suggest a daily idea based on your interests and deadlines
  - rank and summarize real news headlines (never invented)
- **Morning/nightly cron jobs** for a daily briefing and progress check, once deployed

## Tech stack

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · NextAuth (Google) ·
Supabase (Postgres) · Gemini API · Google Calendar/Drive APIs · NewsAPI

## Getting started

1. Copy your credentials into `.env.local` (Google OAuth, Gemini, Supabase, NewsAPI).
2. Run `supabase/schema.sql` in your Supabase project's SQL editor.
3. `npm install && npm run dev` → [http://localhost:3000](http://localhost:3000)

Full setup walkthrough and the original build plan: [`personal-ai-assistant-plan.md`](./personal-ai-assistant-plan.md).

## Deploying

Push to GitHub → import into Vercel → copy `.env.local` into Vercel's Environment
Variables → add the production redirect URI in Google Cloud Console.
