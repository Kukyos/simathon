-- Wipes everything for one user: roster, profile, phases, submission, messages.
-- Does NOT delete from auth.users (you'd need the admin API for that), but the
-- user becomes invisible to the app — re-add via add_participant.sql to re-enable.

do $$
declare
  target text := lower('REPLACE_ME@example.com');
begin
  delete from public.messages       where lower(user_email) = target;
  delete from public.phase_progress where lower(user_email) = target;
  delete from public.submissions    where lower(user_email) = target;
  delete from public.profiles       where lower(user_email) = target;
  delete from public.allowed_emails where lower(email)      = target;
end $$;
