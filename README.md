# Personal AI Assistant

Single-user Next.js dashboard: Google Calendar, Google Drive notes, tasks/deadlines,
and a Gemini-powered AI layer (workflows, progress analysis, daily ideas, news digest).
Full build plan in [`personal-ai-assistant-plan.md`](./personal-ai-assistant-plan.md).

## Setup

1. Fill in `.env.local` (see below for where each key comes from).
2. Run the schema in `supabase/schema.sql` against your Supabase project's SQL editor.
3. `npm install` (already done if you're reading this after the initial build).
4. `npm run dev` and open [http://localhost:3000](http://localhost:3000).

### `.env.local` — where each value comes from

| Variable | Source |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials (OAuth client, redirect URI `http://localhost:3000/api/auth/callback/google`) |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Project Settings → API |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) |
| `CRON_SECRET` | any long random string — also set as the `Authorization: Bearer <value>` expectation once deployed to Vercel |

## Structure

- `app/(app)/*` — authenticated pages (dashboard, calendar, notes, tasks, semester), guarded by `app/(app)/layout.tsx`.
- `app/api/*` — route handlers (auth, calendar, notes, tasks, reminders, semester-notes, AI, cron).
- `lib/` — Google/Supabase/Gemini clients, shared auth/session helpers.
- `supabase/schema.sql` — run this once in the Supabase SQL editor.
- `vercel.json` — cron schedule for the morning briefing / nightly progress jobs (only runs once deployed).

## Deploying

Not done yet — push to GitHub, import into Vercel, copy every `.env.local` value into
Vercel's Environment Variables, and add the production callback URL in Google Cloud Console
before going live.
