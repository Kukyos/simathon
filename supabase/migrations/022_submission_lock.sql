-- ============================================================
-- Migration 022: lock submissions + "late" badge + delete guard.
--
-- Design: enforce the lock with TRIGGERS, not by rewriting the
-- submissions RLS policy. While unlocked the triggers are no-ops, so
-- running this against the live DB during active submitting is safe.
-- The triggers still fire on direct API/console writes, so the lock is
-- real — a disabled button in the UI is only courtesy.
--
-- Also hardens a live footgun: submissions_open is `for all using(true)`,
-- so today ANY authenticated participant can DELETE any submission from
-- the browser console. The delete-guard trigger closes that.
--
-- Run in Supabase SQL editor BEFORE deploying the matching UI. Idempotent.
-- ============================================================

-- 1. Config flag. Standalone — don't assume 020 created app_config.
create table if not exists public.app_config (
  id int primary key default 1,
  constraint single_row check (id = 1)
);
insert into public.app_config (id) values (1) on conflict (id) do nothing;
alter table public.app_config
  add column if not exists submissions_locked boolean not null default false;
alter table public.app_config enable row level security;
-- No policies: reachable only via the SECURITY DEFINER RPCs below.

-- Public read — the submit page + gallery need to know the lock state.
create or replace function public.submissions_locked()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select submissions_locked from public.app_config where id = 1), false);
$$;
grant execute on function public.submissions_locked() to anon, authenticated;

-- Admin check. Hardcoded primary admin (matches lib/admin.ts) OR the DB
-- is_admin flag — so moderation-under-lock never depends on the DB flag
-- being set for the one account that matters.
create or replace function public.is_caller_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'amohamedarmaan@gmail.com'
      or exists (
        select 1 from public.allowed_emails
        where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          and coalesce(is_admin, false) = true
      );
$$;
grant execute on function public.is_caller_admin() to anon, authenticated;

-- Admin toggle.
create or replace function public.admin_set_submissions_locked(p_locked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'forbidden';
  end if;
  update public.app_config set submissions_locked = p_locked where id = 1;
end;
$$;
grant execute on function public.admin_set_submissions_locked(boolean) to authenticated;

-- 2. "Late" badge column. Purely a moderation tag set at review time.
alter table public.submissions
  add column if not exists is_late boolean not null default false;

-- 3. Lock trigger. Admins always pass. Non-admins: blocked when locked,
--    and may only ever write their OWN row (closes a rival-overwrite hole).
create or replace function public.enforce_submission_lock()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.is_caller_admin() then
    return new;
  end if;
  if public.submissions_locked() then
    raise exception 'submissions are locked';
  end if;
  if lower(new.user_email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'forbidden';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_enforce_submission_lock on public.submissions;
create trigger trg_enforce_submission_lock
  before insert or update on public.submissions
  for each row execute function public.enforce_submission_lock();

-- 4. Delete guard. Only admins may delete a submission — ever.
create or replace function public.guard_submission_delete()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_caller_admin() then
    raise exception 'forbidden';
  end if;
  return old;
end;
$$;
drop trigger if exists trg_guard_submission_delete on public.submissions;
create trigger trg_guard_submission_delete
  before delete on public.submissions
  for each row execute function public.guard_submission_delete();

-- 5. Close the image-swap hole: screenshots live at a fixed public path, so
--    a locked-out participant could overwrite the file with no row write.
--    Gate the submissions bucket writes on the same lock. Additive: while
--    unlocked `not locked` is true, so behavior is unchanged.
drop policy if exists "submissions_insert" on storage.objects;
create policy "submissions_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and (not public.submissions_locked() or public.is_caller_admin())
  );

drop policy if exists "submissions_update" on storage.objects;
create policy "submissions_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'submissions'
    and (not public.submissions_locked() or public.is_caller_admin())
  );
