insert into public.allowed_emails (email, full_name)
values ('REPLACE_ME@example.com', null)
on conflict (email) do nothing;
