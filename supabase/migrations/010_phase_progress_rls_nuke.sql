-- ============================================================
-- Migration 010: drop every policy on phase_progress, install one open one.
-- Same pattern as 009 (messages). Authorization happens via the admin RPCs.
-- ============================================================

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'phase_progress'
  loop
    execute format('drop policy if exists %I on public.phase_progress', p.policyname);
  end loop;
end $$;

create policy "phase_progress_open" on public.phase_progress
  for all to authenticated
  using (true) with check (true);

alter table public.phase_progress enable row level security;

-- While we're here: same nuke for profiles and submissions, since the same
-- ghost policies probably haunt them too.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;
create policy "profiles_open" on public.profiles
  for all to authenticated using (true) with check (true);
alter table public.profiles enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'submissions'
  loop
    execute format('drop policy if exists %I on public.submissions', p.policyname);
  end loop;
end $$;
create policy "submissions_open" on public.submissions
  for all to authenticated using (true) with check (true);
alter table public.submissions enable row level security;
