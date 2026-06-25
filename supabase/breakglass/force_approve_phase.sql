-- Force-approve one user's phase (skip review). Edit email + phase number.

insert into public.phase_progress (user_email, phase, status, reviewed_at, reviewed_by)
values (lower('REPLACE_ME@example.com'), 1, 'approved', now(), 'breakglass')
on conflict (user_email, phase) do update set
  status      = 'approved',
  reviewed_at = now(),
  reviewed_by = 'breakglass';
