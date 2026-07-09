# Personal AI Assistant — Implementation Plan

A step-by-step build plan for a personal AI dashboard that integrates Google Calendar, Google Drive notes, task/deadline tracking, AI-generated workflows, progress analysis, daily idea suggestions, and a personalized news digest.

This document is written to be handed to **Claude Code**. Each phase separates **Manual setup** (things you must do yourself in a browser — Claude Code cannot create Google Cloud projects or click through OAuth consent screens) from **Claude Code tasks** (things the AI can build in your repo).

---

## 0. How to use this document with Claude Code

1. Create an empty folder for the project and open it in Claude Code.
2. Complete the **Manual setup** items at the start of each phase yourself.
3. For each Claude Code task, paste the relevant section into Claude Code, or say: *"Read `personal-ai-assistant-plan.md` and implement Phase 1."*
4. Do the phases **in order**. Auth must exist before anything else works, because the Google access tokens from login are what authorize Calendar and Drive.
5. After each phase there is a **Checkpoint** — do not move on until it passes.

---

## 1. What we are building

A single-user web app (just you) with:

- Google login (your account only)
- A dashboard home page: today's calendar events, today's tasks, AI morning briefing, news digest, quick-add box
- Google Calendar integration (read + create events)
- Google Drive integration (a dedicated notes folder, read + create notes)
- A database for tasks, deadlines, reminders, day-by-day semester notes, progress logs, and AI suggestions
- An AI layer (Gemini) that: turns notes into step-by-step workflows, analyzes weekly progress, suggests daily ideas, and ranks/summarizes news

### Important clarification about Google AI Studio

Google AI Studio is **not** a hosting platform. It is where you (a) experiment with prompts and (b) generate a **Gemini API key**. The app itself is a Next.js web app you build and deploy. AI Studio provides the "brain" (the API key + tested prompts); this project is the "body."

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | React frontend + built-in server API routes in one project |
| Language | **TypeScript** | Safer, better Claude Code output |
| Auth | **NextAuth.js (Auth.js) — Google provider** | Handles Google login *and* returns Calendar/Drive tokens |
| Database | **Supabase (Postgres)** | Free tier, simple client, good with Next.js |
| AI | **Gemini API** via `@google/generative-ai` | From AI Studio; use `gemini-1.5-flash` (fast + cheap) |
| Calendar/Drive | **Google APIs** via `googleapis` npm package | Official Node client |
| News | **NewsAPI.org** (or RSS) | Live headlines Gemini can rank/summarize |
| Scheduled jobs | **Vercel Cron** | Free morning-briefing + nightly-analysis triggers |
| Styling | **Tailwind CSS** | Fast, works well with Claude Code |
| Calendar UI | **FullCalendar React** | Ready-made calendar component |
| Hosting | **Vercel** | Free, native Next.js deploy |

Everything here has a free tier sufficient for single-user use.

---

## 3. Prerequisites (do this once, before Phase 1)

### Manual setup

1. **Google Cloud Console** (`console.cloud.google.com`)
   - Create a new project (e.g. `personal-assistant`).
   - Go to **APIs & Services → Library** and enable:
     - Google Calendar API
     - Google Drive API
     - Generative Language API (this is the Gemini API)
   - Go to **APIs & Services → OAuth consent screen**:
     - User type: **External**
     - Fill app name, your email as support + developer contact.
     - Add scopes (you can also add them later): `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `.../auth/calendar.events`, `.../auth/drive.file`
     - Under **Test users**, add your own Google email. (While the app is in "Testing" mode only test users can log in — that's fine for a personal app.)
   - Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
     - Application type: **Web application**
     - Authorized JavaScript origins: `http://localhost:3000`
     - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
     - Save the **Client ID** and **Client Secret**.

2. **Gemini API key** — go to `aistudio.google.com` → **Get API key** → create key in the same Google Cloud project. Save it.

3. **Supabase** (`supabase.com`) — create a free project. From **Project Settings → API**, save the **Project URL**, the **anon public key**, and the **service_role key** (server-only).

4. **NewsAPI** (`newsapi.org`) — register for a free API key. (Free tier is developer/localhost-friendly.)

5. Install **Node.js 18+** locally if you haven't.

> Keep all these keys in a scratch file for now. In Phase 1 they go into `.env.local`. **Never commit them.**

### Checkpoint 0
You have: Google Client ID + Secret, Gemini API key, Supabase URL + two keys, NewsAPI key, Node 18+ installed. ✅

---

## 4. Phase 1 — Project scaffold + Google login

**Goal:** A running Next.js app where you can click "Sign in with Google" and see your name/email, with Calendar + Drive permissions granted.

### Claude Code tasks

1. Scaffold the project:
   - Create a Next.js 14 app (App Router, TypeScript, Tailwind, ESLint).
   - Install: `next-auth`, `googleapis`, `@google/generative-ai`, `@supabase/supabase-js`, `@fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`.

2. Create `.env.local` (see Appendix A) and add `.env.local` to `.gitignore`.

3. Configure **NextAuth** at `app/api/auth/[...nextauth]/route.ts`:
   - Google provider with Client ID/Secret from env.
   - Request offline access + these scopes so we get a refresh token and API permissions:
     ```
     openid email profile
     https://www.googleapis.com/auth/calendar.events
     https://www.googleapis.com/auth/drive.file
     ```
   - Set `access_type=offline` and `prompt=consent` in `authorization.params`.
   - In the `jwt` callback, persist `access_token`, `refresh_token`, and `expires_at` onto the token.
   - In the `session` callback, expose `accessToken` on the session so server routes can use it.
   - Implement a **token refresh** helper: if `expires_at` has passed, use the refresh token to get a new access token before returning the session. (This is essential — Google access tokens expire in ~1 hour.)

4. Create a `SessionProvider` wrapper and wrap the root layout.

5. Build a minimal `app/page.tsx`:
   - If signed out: a "Sign in with Google" button.
   - If signed in: show avatar, name, email, and a "Sign out" button.

6. Add a typed `next-auth.d.ts` to extend the Session type with `accessToken`.

### Checkpoint 1
Run `npm run dev`, visit `localhost:3000`, sign in with Google, approve the Calendar + Drive consent screen, and see your name/email. The session (inspect via a temporary debug log) contains an `accessToken`. ✅

---

## 5. Phase 2 — Database schema (Supabase)

**Goal:** All app tables exist and are reachable from the server.

### Manual setup
In the Supabase dashboard, open **SQL Editor** and run the schema in **Appendix B**. (Or have Claude Code generate a `supabase/schema.sql` file and you paste it in.)

### Claude Code tasks
1. Create `lib/supabase.ts`:
   - A **server-side** client using the `service_role` key (used only inside API routes — never shipped to the browser).
2. Create TypeScript types matching the tables (Appendix B) in `types/db.ts`.
3. Create a `lib/user.ts` helper that resolves the current signed-in user's email into a stable `user_id` row (create-on-first-login pattern) so all data is scoped to you.

### Checkpoint 2
A temporary test API route can insert a task and read it back from Supabase. ✅

---

## 6. Phase 3 — Google Calendar integration

**Goal:** View, add, and sync calendar events.

### Claude Code tasks
1. Create `lib/google.ts`:
   - A factory that builds an authenticated `google.calendar('v3')` and `google.drive('v3')` client from the session's `accessToken` (and refresh logic from Phase 1).
2. API routes under `app/api/calendar/`:
   - `GET /api/calendar/events?start=&end=` → `events.list` for the primary calendar in a date range.
   - `POST /api/calendar/events` → `events.insert` (body: title, description, start, end). Include a default reminder override so Google notifies you.
3. Calendar UI at `app/calendar/page.tsx`:
   - FullCalendar with day/week/month views.
   - Fetch events for the visible range.
   - A "quick add event" form/modal that POSTs and refreshes.

### Notes
- Because events live in real Google Calendar, they sync to your phone and fire native reminders automatically — you don't have to build a notification system for time-based events.
- Store nothing calendar-related in your own DB; Google is the source of truth for events.

### Checkpoint 3
Add an event in the app → it appears in Google Calendar on your phone, and vice versa after refresh. ✅

---

## 7. Phase 4 — Google Drive notes

**Goal:** A dedicated notes folder in your Drive, with create/list/read from the app.

### Claude Code tasks
1. On first use, create a folder named `PersonalAssistant Notes` via Drive `files.create` (mimeType `application/vnd.google-apps.folder`) and store its `folder_id` in a `settings` table (Appendix B). Reuse it thereafter.
   - Note: the `drive.file` scope only grants access to files your app creates — which is exactly what we want (privacy-friendly, no access to the rest of your Drive).
2. API routes under `app/api/notes/`:
   - `GET /api/notes` → `files.list` within the folder (name, id, modifiedTime).
   - `POST /api/notes` → create a note (start as a plain text/Google Doc file inside the folder).
   - `GET /api/notes/[id]` → read a note's content (`files.export` for Docs, or `files.get?alt=media` for text).
   - `PUT /api/notes/[id]` → update content.
3. Notes UI at `app/notes/page.tsx`:
   - List on the left, editor on the right, save button.

### Checkpoint 4
Create a note in the app → it appears in the `PersonalAssistant Notes` folder in Google Drive. ✅

---

## 8. Phase 5 — Tasks, deadlines, reminders, semester notes

**Goal:** The task/planning core the AI will later analyze.

### Claude Code tasks
1. API routes under `app/api/tasks/`:
   - `GET /api/tasks?week=&status=` → list, filterable by semester week and status.
   - `POST /api/tasks` → create (title, description, deadline, semester_week, priority).
   - `PATCH /api/tasks/[id]` → update status/fields (mark done, edit).
   - `DELETE /api/tasks/[id]`.
2. API routes under `app/api/reminders/` (simple: title, remind_at, note).
3. API routes under `app/api/semester-notes/` — day-by-day notes keyed by date and semester week (for "day-by-day notes for the next semester").
4. UI:
   - `app/tasks/page.tsx` — task list grouped by deadline, with checkboxes, add form, filters by semester week.
   - A semester view: a grid of weeks; clicking a day opens that day's note + tasks.
5. Whenever a task has a deadline, optionally also create a matching Calendar event (reuse the Phase 3 route) so it shows up on your calendar and phone.

### Checkpoint 5
You can add tasks with deadlines and semester weeks, mark them done, and add per-day notes. Data persists in Supabase. ✅

---

## 9. Phase 6 — The AI layer (Gemini)

**Goal:** Workflows, progress analysis, daily ideas, and news — all powered by Gemini.

> **Prompt-first:** Before coding each feature, open Google AI Studio, paste sample data, and iterate on the prompt until the output is consistently good. Then copy the finalized prompt into your code. Appendix C has starter prompts.

### Claude Code tasks

1. Create `lib/gemini.ts`:
   - Initialize `@google/generative-ai` with `GEMINI_API_KEY`, model `gemini-1.5-flash`.
   - A helper `generateJSON(prompt)` that instructs the model to return **only** valid JSON (no markdown fences), strips any stray ```` ``` ````, and `JSON.parse`s safely with a try/catch fallback.

2. **Workflow generation** — `POST /api/ai/workflow`:
   - Input: a note ID (or raw text).
   - Fetch the note content from Drive, send to Gemini with the "workflow" prompt, request JSON: an array of steps `{ title, detail, estimate_minutes }`.
   - Save the workflow to the `workflows` table and return it.
   - UI: a "Generate workflow" button on each note → renders checkable steps.

3. **Progress tracking** — `POST /api/ai/progress`:
   - Gather last 7 days of tasks (done vs pending, missed deadlines) from Supabase.
   - Send to Gemini with the "progress analysis" prompt → JSON `{ summary, whats_behind[], suggested_priorities[] }`.
   - Store in `ai_suggestions` with type `progress`.

4. **Daily ideas** — `POST /api/ai/ideas`:
   - Combine your `interests` (from `settings`), current tasks, and upcoming deadlines.
   - Gemini returns 1–2 concrete ideas for the day → store as `ai_suggestions` type `idea`.

5. **News digest** — `POST /api/ai/news`:
   - Call NewsAPI with your interest keywords (`app/api/news/route.ts` wraps NewsAPI).
   - Pass the headlines + descriptions to Gemini with the "news ranking" prompt → JSON: top 5 with a one-line summary and why-relevant each.
   - Store as `ai_suggestions` type `news`.
   - Gemini alone should **not** be trusted to "know" today's news — always fetch real headlines first, then let Gemini rank/summarize. Cite sources by keeping each article's URL.

### Checkpoint 6
Each of the four AI endpoints returns clean, parseable JSON and its result is stored and rendered in the UI. ✅

---

## 10. Phase 7 — Scheduled jobs (morning briefing + nightly analysis)

**Goal:** The app updates itself without you clicking buttons.

### Manual setup
This works once deployed to Vercel (Phase 9). Cron does not run on localhost.

### Claude Code tasks
1. Create `vercel.json` with two cron entries (Appendix D): e.g. `0 6 * * *` (morning) and `0 22 * * *` (night), in your timezone considerations.
2. Create cron endpoints:
   - `GET /api/cron/morning` → runs daily ideas + news digest, stores results for the dashboard.
   - `GET /api/cron/nightly` → runs progress analysis.
3. Protect cron routes with a secret header (`CRON_SECRET`) so only Vercel can trigger them.

### Checkpoint 7
After deploy, the dashboard shows a fresh briefing each morning without manual action. ✅

---

## 11. Phase 8 — The dashboard (tie it all together)

**Goal:** One home page that makes it feel like an assistant.

### Claude Code tasks
Rebuild `app/page.tsx` (signed-in state) as a dashboard with cards:
1. **Today** — today's calendar events (from Phase 3) + today's tasks with checkboxes (Phase 5).
2. **Morning briefing** — latest `idea` suggestion (Phase 6/7).
3. **News digest** — latest `news` suggestion, each item linking to its source.
4. **Progress** — latest `progress` analysis summary.
5. **Quick add** — a single box that can add a task or a note (with a small toggle), so capture is one click from home.
6. Navigation to Calendar, Notes, Tasks, Semester pages.

### Checkpoint 8
The home page shows a live, useful snapshot of your day pulling from all sources. ✅

---

## 12. Phase 9 — Deploy

### Manual setup
1. Push the repo to GitHub.
2. Import into **Vercel**, add all env vars from `.env.local` into Vercel's Environment Variables.
3. In Google Cloud Console, add your Vercel production URL to **Authorized JavaScript origins** and add `https://YOUR-APP.vercel.app/api/auth/callback/google` to **Authorized redirect URIs**.
4. Set `NEXTAUTH_URL` to the production URL in Vercel.

### Checkpoint 9
The live URL lets you log in, and cron jobs run on schedule. ✅

---

## 13. Suggested build order summary

1. Phase 1 — Auth (everything depends on Google tokens)
2. Phase 2 — Database
3. Phase 3 — Calendar
4. Phase 4 — Drive notes
5. Phase 5 — Tasks / semester planning
6. Phase 6 — AI features
7. Phase 7 — Cron
8. Phase 8 — Dashboard
9. Phase 9 — Deploy

Do not skip ahead: the AI phases assume tasks/notes already exist to analyze.

---

## Appendix A — `.env.local` template

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=            # generate: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini (from AI Studio)
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # server-only, never expose to browser

# News
NEWS_API_KEY=

# Cron protection
CRON_SECRET=                # any long random string
```

> `SUPABASE_SERVICE_ROLE_KEY` and all API keys must only ever be read inside server code (API routes). Never prefix them with `NEXT_PUBLIC_`.

---

## Appendix B — Supabase schema

```sql
-- Users (one row: you)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- App settings / profile (notes folder id, interests, news keywords)
create table settings (
  user_id uuid references users(id) on delete cascade,
  notes_folder_id text,
  interests text[],          -- e.g. {"AI","football","startups"}
  news_keywords text[],
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- Tasks / deadlines
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz,
  semester_week int,         -- 1..N for the semester
  priority text default 'normal',  -- low | normal | high
  status text default 'todo',      -- todo | doing | done
  calendar_event_id text,          -- link to Google Calendar event, if any
  created_at timestamptz default now()
);

-- Simple reminders
create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  note text,
  remind_at timestamptz not null,
  created_at timestamptz default now()
);

-- Day-by-day semester notes
create table semester_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  note_date date not null,
  semester_week int,
  content text,
  created_at timestamptz default now(),
  unique (user_id, note_date)
);

-- AI-generated workflows (from Drive notes)
create table workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  source_note_id text,       -- Drive file id
  title text,
  steps jsonb,               -- [{title, detail, estimate_minutes, done}]
  created_at timestamptz default now()
);

-- AI suggestions: ideas, progress analyses, news digests
create table ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null,        -- idea | progress | news
  payload jsonb not null,    -- structured result from Gemini
  created_at timestamptz default now()
);
```

> For a single-user personal app you can keep Row Level Security off and only touch the DB via the server `service_role` client. If you later open it to others, enable RLS and scope every table by `user_id`.

---

## Appendix C — Starter Gemini prompts

Tune these in AI Studio first, then paste the final versions into your code. All ask for JSON-only output.

**Workflow generation**
```
You are a planning assistant. Turn the following note into an actionable,
ordered workflow. Return ONLY valid JSON, no markdown, in this shape:
{"title": string, "steps": [{"title": string, "detail": string, "estimate_minutes": number}]}

NOTE:
"""
{{note_content}}
"""
```

**Progress analysis**
```
You are a productivity coach. Given this JSON of the user's tasks from the last
7 days (with status and deadlines), analyze their progress. Return ONLY valid
JSON: {"summary": string, "whats_behind": string[], "suggested_priorities": string[]}

TASKS:
{{tasks_json}}
```

**Daily ideas**
```
Given the user's interests {{interests}}, their open tasks {{tasks_json}}, and
upcoming deadlines {{deadlines_json}}, suggest 1-2 concrete, specific ideas or
focuses for today. Return ONLY valid JSON: {"ideas": [{"idea": string, "why": string}]}
```

**News ranking / summary**
```
Here are today's news articles as JSON (title, description, url, source). The
user cares about: {{interests}}. Pick the 5 most relevant, summarize each in one
sentence, and explain relevance briefly. Return ONLY valid JSON:
{"items": [{"title": string, "summary": string, "why_relevant": string, "url": string, "source": string}]}

ARTICLES:
{{articles_json}}
```

> Always fetch real news from NewsAPI first and pass it in — never ask Gemini to recall current headlines from memory.

---

## Appendix D — `vercel.json` cron

```json
{
  "crons": [
    { "path": "/api/cron/morning", "schedule": "0 6 * * *" },
    { "path": "/api/cron/nightly", "schedule": "0 22 * * *" }
  ]
}
```

> Vercel cron uses UTC. Adjust the hours for your timezone (Sri Lanka is UTC+5:30, so 6:00 local ≈ `30 0 * * *` UTC). Verify each cron route checks the `CRON_SECRET` header before running.

---

## Appendix E — Suggested file structure

```
personal-assistant/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                     # dashboard (signed-in) / login (signed-out)
│  ├─ calendar/page.tsx
│  ├─ notes/page.tsx
│  ├─ tasks/page.tsx
│  ├─ semester/page.tsx
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts
│     ├─ calendar/events/route.ts
│     ├─ notes/route.ts
│     ├─ notes/[id]/route.ts
│     ├─ tasks/route.ts
│     ├─ tasks/[id]/route.ts
│     ├─ reminders/route.ts
│     ├─ semester-notes/route.ts
│     ├─ news/route.ts
│     ├─ ai/workflow/route.ts
│     ├─ ai/progress/route.ts
│     ├─ ai/ideas/route.ts
│     ├─ ai/news/route.ts
│     └─ cron/morning/route.ts
│     └─ cron/nightly/route.ts
├─ lib/
│  ├─ supabase.ts
│  ├─ google.ts
│  ├─ gemini.ts
│  └─ user.ts
├─ types/
│  ├─ db.ts
│  └─ next-auth.d.ts
├─ supabase/schema.sql
├─ vercel.json
├─ .env.local        # gitignored
└─ package.json
```

---

## Appendix F — Common pitfalls

- **Access token expired (401 from Google):** you skipped refresh-token handling in Phase 1. Access tokens last ~1 hour; you must refresh using the refresh token. Ensure `access_type=offline` + `prompt=consent` were set so Google actually returns a refresh token.
- **No refresh token returned:** Google only sends it on first consent. If you tested before adding offline access, remove the app's access at `myaccount.google.com/permissions` and log in again.
- **Drive scope too broad:** `drive.file` is enough and keeps the app limited to files it created. Don't request full Drive access.
- **Gemini returns markdown-wrapped JSON:** strip ```` ```json ```` fences before parsing; wrap `JSON.parse` in try/catch.
- **Keys leaking to the browser:** only `NEXT_PUBLIC_*` vars reach the client. Keep all secrets unprefixed and use them only in `app/api/**` routes.
- **Cron not firing:** cron only runs on deployed Vercel, not localhost, and uses UTC.
- **OAuth "app not verified":** expected while in Testing mode; since you're the only (test) user, click through. Verification is only needed for public multi-user apps.

---

## Appendix G — First message to give Claude Code

> "Read `personal-ai-assistant-plan.md`. Implement **Phase 1** only: scaffold the Next.js 14 + TypeScript + Tailwind app, install the listed dependencies, set up NextAuth with the Google provider requesting the Calendar and Drive scopes with offline access and refresh-token handling, create the `.env.local` template, and build a minimal login/logout home page. Stop at the Phase 1 checkpoint so I can test signing in."

Then proceed one phase at a time.
