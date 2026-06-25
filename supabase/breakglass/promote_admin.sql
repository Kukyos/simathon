-- Promote a user to admin. Edit the email below.
-- They must already exist in allowed_emails — if not, run add_participant.sql first.

insert into public.allowed_emails (email, is_admin)
values ('REPLACE_ME@example.com', true)
on conflict (email) do update set is_admin = true;

-- Verify:
select email, full_name, is_admin
from public.allowed_emails
where lower(email) = lower('REPLACE_ME@example.com');
