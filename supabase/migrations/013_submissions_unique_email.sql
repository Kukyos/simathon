-- Make the upsert(onConflict: "user_email") in SubmitForm actually conflict.
-- Without this, double-click on Submit creates duplicate rows silently.
create unique index if not exists submissions_user_email_key
  on public.submissions (user_email);
