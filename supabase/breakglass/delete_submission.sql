delete from public.submissions
where lower(user_email) = lower('REPLACE_ME@example.com');
-- Note: this leaves uploaded files in storage. Delete the folder manually
-- from Supabase Storage → submissions bucket → <email-with-special-chars-escaped>/
