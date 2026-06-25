-- Run this whole script. Every "should be" comment tells you the expected output.
-- If any row is missing or wrong, something needs fixing.

-- 1. All five core tables exist with RLS on, one open policy each.
select tablename, rowsecurity
from pg_tables where schemaname = 'public'
  and tablename in ('allowed_emails','profiles','phase_progress','messages','submissions')
order by tablename;
-- should be: 5 rows, rowsecurity = true on all

select tablename, policyname, cmd, roles
from pg_policies where schemaname = 'public'
order by tablename;
-- should be: 1 policy per table named "<table>_open" or similar, cmd = ALL

-- 2. Both storage buckets exist.
select id, public from storage.buckets where id in ('phase_proofs','submissions');
-- should be: 2 rows, public = true

-- 3. Realtime publication contains messages.
select schemaname, tablename from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
-- should include: messages

-- 4. submissions has the `files` jsonb column (added in 012).
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'submissions'
  and column_name in ('files','video_url','screenshot_url');
-- should be: 3 rows, files = jsonb

-- 5. allowed_emails has is_admin.
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'allowed_emails' and column_name = 'is_admin';
-- should be: 1 row, boolean

-- 6. At least one admin exists.
select email, is_admin from public.allowed_emails where coalesce(is_admin, false) = true;
-- should be: ≥1 row (the founder admin)

-- 7. Critical RPCs are present.
select proname from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'admin_add_participant','admin_remove_participant','admin_set_admin',
    'review_phase','am_i_admin','upsert_my_profile','is_email_allowed',
    'get_participants','post_message'
  )
order by proname;
-- should be: 9 names listed

-- 8. messages table has is_admin column.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'messages' and column_name = 'is_admin';
-- should be: 1 row
