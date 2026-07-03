-- ============================================================
-- Migration 020: admin lock/unlock for sign-ups.
--
-- LOCKED (default): only emails in allowed_emails can sign in.
-- UNLOCKED: anyone can sign in; their email is auto-added to the
--   roster so downstream RLS (is_allowlisted) lets them participate.
--   For live walk-ins who never registered. Flip back to locked after.
-- Run in Supabase SQL editor after 019. Idempotent.
-- ============================================================

create table if not exists public.app_config (
  id int primary key default 1,
  open_signups boolean not null default false,
  constraint single_row check (id = 1)
);
insert into public.app_config (id, open_signups)
  values (1, false)
  on conflict (id) do nothing;

alter table public.app_config enable row level security;
-- No policies: only reachable via the SECURITY DEFINER RPCs below.

-- Public read — the login form needs to know before sending a link.
create or replace function public.signups_open()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select open_signups from public.app_config where id = 1), false);
$$;
grant execute on function public.signups_open() to anon, authenticated;

-- Login gate. If open, auto-enroll the email and allow. Else check roster.
-- Replaces the plain is_email_allowed check the login form used to call.
create or replace function public.signup_gate(check_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare e text := lower(check_email);
begin
  if e !~ '^.+@.+\..+$' then
    return false;
  end if;
  if public.signups_open() then
    -- ponytail: enroll on precheck (before they click the link). A random
    -- email typed while unlocked gets added; fine for a 1-week walk-in flow.
    insert into public.allowed_emails (email) values (e) on conflict do nothing;
    return true;
  end if;
  return exists (select 1 from public.allowed_emails where lower(email) = e);
end;
$$;
grant execute on function public.signup_gate(text) to anon, authenticated;

-- Admin toggle.
create or replace function public.admin_set_signups_open(p_open boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  update public.app_config set open_signups = p_open where id = 1;
end;
$$;
grant execute on function public.admin_set_signups_open(boolean) to authenticated;
