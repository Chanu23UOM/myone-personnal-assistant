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

-- For a single-user personal app, Row Level Security is left off; the app only
-- talks to these tables via the server-side service_role client (see lib/supabase.ts).
-- If this ever becomes multi-user, enable RLS and scope every table by user_id.
