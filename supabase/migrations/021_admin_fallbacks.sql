-- ============================================================
-- Migration 021: admin panel fixes + fallbacks.
--
-- 1. get_participants(): 018 replaced the rich version from 003 with a
--    slim one, which silently broke the admin panel (no phase statuses,
--    no is_admin, no platform). Recreate with the UNION of all columns
--    so both /participants and /admin work off one function.
-- 2. admin_add_participant(): return a status text instead of void so
--    the UI can say "added" vs "already on list" vs "already signed in".
-- 3. admin_set_phase(): force-approve / reject / reset a phase for a
--    participant even if they never submitted (fallback button).
-- 4. admin_approve_all_pending(): one-click approve everything pending.
--
-- Run in Supabase SQL editor after 020. Idempotent.
-- ============================================================

-- 1. get_participants — superset of 003 + 018.
drop function if exists public.get_participants();

create function public.get_participants()
returns table (
  email text,
  full_name text,
  platform text,
  has_gpu boolean,
  is_admin boolean,
  last_sign_in_at timestamptz,
  phase1_status text,
  phase2_status text,
  phases_complete int,
  submission_id uuid,
  submission_title text,
  submission_tagline text,
  submission_screenshot text,
  submission_status text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    a.email,
    coalesce(p.full_name, a.full_name)  as full_name,
    p.platform,
    p.has_gpu,
    coalesce(a.is_admin, false)         as is_admin,
    u.last_sign_in_at,
    p1.status                           as phase1_status,
    p2.status                           as phase2_status,
    (
      (case when p1.status = 'approved' then 1 else 0 end) +
      (case when p2.status = 'approved' then 1 else 0 end)
    )                                   as phases_complete,
    s.id                                as submission_id,
    s.title                             as submission_title,
    s.tagline                           as submission_tagline,
    s.screenshot_url                    as submission_screenshot,
    s.gallery_status                    as submission_status
  from public.allowed_emails a
  left join public.profiles p        on lower(p.user_email)  = lower(a.email)
  left join auth.users u             on lower(u.email)       = lower(a.email)
  left join public.phase_progress p1 on lower(p1.user_email) = lower(a.email) and p1.phase = 1
  left join public.phase_progress p2 on lower(p2.user_email) = lower(a.email) and p2.phase = 2
  left join public.submissions s     on lower(s.user_email)  = lower(a.email)
  order by u.last_sign_in_at desc nulls last, a.email;
$$;
grant execute on function public.get_participants() to authenticated;

-- 2. admin_add_participant — now reports what actually happened.
--    returns: 'added' | 'exists' | 'exists_signed_in'
drop function if exists public.admin_add_participant(text, text);

create function public.admin_add_participant(p_email text, p_name text default null)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  e text := lower(trim(p_email));
  already boolean;
  signed_in boolean;
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  if e !~ '^.+@.+\..+$' then
    raise exception 'invalid_email';
  end if;

  already := exists (select 1 from public.allowed_emails where lower(email) = e);

  insert into public.allowed_emails (email, full_name)
  values (e, nullif(trim(coalesce(p_name, '')), ''))
  on conflict (email) do update set
    full_name = coalesce(excluded.full_name, public.allowed_emails.full_name);

  if not already then
    return 'added';
  end if;
  select exists (
    select 1 from auth.users u
    where lower(u.email) = e and u.last_sign_in_at is not null
  ) into signed_in;
  return case when signed_in then 'exists_signed_in' else 'exists' end;
end;
$$;
grant execute on function public.admin_add_participant(text, text) to authenticated;

-- 3. Force-set a phase for a participant, submission or not.
--    p_status: 'approved' | 'rejected' | 'pending' | 'none' (none = wipe the row)
create or replace function public.admin_set_phase(p_email text, p_phase int, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(p_email));
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  if p_phase not between 1 and 3 then
    raise exception 'invalid_phase';
  end if;

  if p_status = 'none' then
    delete from public.phase_progress
    where lower(user_email) = e and phase = p_phase;
    return;
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid_status';
  end if;

  -- upsert keeps any proof/caption they already submitted.
  insert into public.phase_progress (user_email, phase, status, caption, reviewed_at, reviewed_by)
  values (e, p_phase, p_status, 'force-set by admin', now(), auth.jwt() ->> 'email')
  on conflict (user_email, phase) do update set
    status = excluded.status,
    reviewed_at = now(),
    reviewed_by = excluded.reviewed_by;
end;
$$;
grant execute on function public.admin_set_phase(text, int, text) to authenticated;

-- 4. Approve everything pending in one click. Returns rows touched.
create or replace function public.admin_approve_all_pending()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  update public.phase_progress
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.jwt() ->> 'email'
  where status = 'pending';
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function public.admin_approve_all_pending() to authenticated;
