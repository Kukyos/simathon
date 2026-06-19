-- ============================================================
-- Idempotent. Safe to run as many times as you want.
-- Flags amohamedarmaan@gmail.com as admin in the DB + skips onboarding.
-- Run this in Supabase SQL editor.
-- ============================================================

-- 1. Make sure required columns exist (won't break if already present).
alter table public.allowed_emails
  add column if not exists is_admin boolean default false;

-- 2. Make sure profiles table exists (in case migration 003 wasn't fully applied).
create table if not exists public.profiles (
  user_email text primary key,
  full_name  text not null,
  platform   text check (platform in ('windows','mac','linux','other')),
  has_gpu    boolean,
  created_at timestamptz default now()
);

-- 3. Promote Armaan to admin (insert or update).
insert into public.allowed_emails (email, full_name, is_admin)
values ('amohamedarmaan@gmail.com', 'Armaan', true)
on conflict (email) do update set
  is_admin  = true,
  full_name = coalesce(public.allowed_emails.full_name, 'Armaan');

-- 4. Insert a profile row so middleware never sends him to /onboard.
insert into public.profiles (user_email, full_name, platform, has_gpu)
values ('amohamedarmaan@gmail.com', 'Armaan', 'windows', true)
on conflict (user_email) do update set
  full_name = excluded.full_name;
