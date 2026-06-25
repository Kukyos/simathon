-- Wipe a user's phase submission so they can resubmit cleanly.
delete from public.phase_progress
where lower(user_email) = lower('REPLACE_ME@example.com')
  and phase = 1; -- edit phase number
