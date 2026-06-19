-- ============================================================
-- Migration 005: route profile upserts through an RPC (sidesteps RLS noise),
-- make admin_add_participant tolerant of empty names,
-- add needs_onboarding() so middleware can short-circuit for admins.
-- ============================================================

-- 1. Upsert one's own profile via SECURITY DEFINER (no RLS to fight).
create or replace function public.upsert_my_profile(
  p_full_name text,
  p_platform text,
  p_has_gpu boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_email text := lower(auth.jwt() ->> 'email');
begin
  if my_email is null or my_email = '' then
    raise exception 'no_session';
  end if;
  if not exists (select 1 from public.allowed_emails where lower(email) = my_email) then
    raise exception 'not_allowlisted';
  end if;
  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'name_required';
  end if;
  if p_platform is not null and p_platform not in ('windows','mac','linux','other') then
    raise exception 'invalid_platform';
  end if;

  insert into public.profiles (user_email, full_name, platform, has_gpu)
  values (my_email, trim(p_full_name), p_platform, p_has_gpu)
  on conflict (user_email) do update set
    full_name = excluded.full_name,
    platform  = excluded.platform,
    has_gpu   = excluded.has_gpu;
end;
$$;

grant execute on function public.upsert_my_profile(text, text, boolean) to authenticated;

-- 2. Combined onboarding check: needs onboarding if no profile AND not an admin.
create or replace function public.needs_onboarding()
returns boolean
language sql
stable
as $$
  select
    not exists(
      select 1 from public.profiles
      where lower(user_email) = lower(auth.jwt() ->> 'email')
    )
    and not exists(
      select 1 from public.allowed_emails
      where lower(email) = lower(auth.jwt() ->> 'email')
        and coalesce(is_admin, false) = true
    );
$$;

grant execute on function public.needs_onboarding() to authenticated;

-- 3. Admin add: accept email-only. Empty name no longer overrides an existing one.
create or replace function public.admin_add_participant(p_email text, p_name text default null)
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
  insert into public.allowed_emails (email, full_name)
  values (lower(p_email), nullif(trim(coalesce(p_name, '')), ''))
  on conflict (email) do update set
    full_name = coalesce(excluded.full_name, public.allowed_emails.full_name);
end;
$$;

grant execute on function public.admin_add_participant(text, text) to authenticated;
