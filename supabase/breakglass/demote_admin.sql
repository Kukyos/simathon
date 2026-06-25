update public.allowed_emails
set is_admin = false
where lower(email) = lower('REPLACE_ME@example.com');
