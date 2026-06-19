-- Run after schema.sql. Returns one row per allowlisted email with sign-in + submission status.
-- SECURITY DEFINER so we can read auth.users without exposing the whole table.

create or replace function public.get_participants()
returns table (
  email text,
  full_name text,
  last_sign_in_at timestamptz,
  submission_id uuid,
  submission_title text,
  submission_tagline text,
  submission_screenshot text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    a.email,
    a.full_name,
    u.last_sign_in_at,
    s.id           as submission_id,
    s.title        as submission_title,
    s.tagline      as submission_tagline,
    s.screenshot_url as submission_screenshot
  from public.allowed_emails a
  left join auth.users u
    on lower(u.email) = lower(a.email)
  left join public.submissions s
    on lower(s.user_email) = lower(a.email)
  order by
    u.last_sign_in_at desc nulls last,
    a.email;
$$;

grant execute on function public.get_participants() to authenticated;
