-- 018: extend get_participants() to expose gallery_status so the participants page can
-- gate the submission link on approval. drop+recreate because Postgres can't add a
-- column to a function's return type with create-or-replace.

drop function if exists public.get_participants();

create or replace function public.get_participants()
returns table (
  email text,
  full_name text,
  last_sign_in_at timestamptz,
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
    a.full_name,
    u.last_sign_in_at,
    s.id              as submission_id,
    s.title           as submission_title,
    s.tagline         as submission_tagline,
    s.screenshot_url  as submission_screenshot,
    s.gallery_status  as submission_status
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
