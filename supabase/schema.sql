-- ============================================================
-- Workshop site schema. Run in Supabase SQL editor.
-- ============================================================

-- 1. Email allowlist (populate with Yuvika's roster).
create table if not exists public.allowed_emails (
  email text primary key,
  full_name text,
  added_at timestamptz default now()
);

-- 2. Chat messages.
create table if not exists public.messages (
  id bigserial primary key,
  user_email text not null,
  display_name text,
  content text not null check (length(content) between 1 and 2000),
  created_at timestamptz default now()
);
create index if not exists messages_created_at_idx on public.messages (created_at desc);

-- 3. Hackathon submissions (one per user; updates allowed until deadline).
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  display_name text,
  title text not null,
  tagline text not null,
  description text not null,
  github_url text,
  video_url text,
  screenshot_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Auth hook: block sign-in attempts from non-allowlisted emails
-- by enforcing it at the policy layer (Supabase magic-link will
-- still create the auth.user row, but the user can't write any
-- rows or read protected data unless allowlisted).
-- ============================================================

create or replace function public.is_allowlisted()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.allowed_emails enable row level security;
alter table public.messages       enable row level security;
alter table public.submissions    enable row level security;

-- Don't expose the roster to anyone. We check membership via the
-- `is_email_allowed` RPC instead, which returns just a boolean.
create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- Chat: any allowlisted user can read + post.
create policy "messages_read" on public.messages
  for select using (public.is_allowlisted());

create policy "messages_insert" on public.messages
  for insert with check (
    public.is_allowlisted()
    and lower(user_email) = lower(auth.jwt() ->> 'email')
  );

-- Submissions: each user reads/writes their own; everyone reads all (gallery).
create policy "submissions_read_all" on public.submissions
  for select using (public.is_allowlisted());

create policy "submissions_insert_own" on public.submissions
  for insert with check (
    public.is_allowlisted()
    and lower(user_email) = lower(auth.jwt() ->> 'email')
  );

create policy "submissions_update_own" on public.submissions
  for update using (
    public.is_allowlisted()
    and lower(user_email) = lower(auth.jwt() ->> 'email')
  );

-- ============================================================
-- Realtime: enable on messages so the chat updates live.
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- Seed: add your own email so you can test before the roster lands.
-- ============================================================
-- insert into public.allowed_emails (email, full_name)
-- values ('amohamedarmaan@gmail.com', 'Armaan');
