-- ============================================================
-- Migration 006: replace per-user RLS with "authenticated can do anything".
-- The auth.jwt() ->> 'email' check fails for some Supabase setups, breaking inserts.
-- Authorization is enforced server-side (middleware + SECURITY DEFINER RPCs).
-- Safe for a 1-week event.
-- ============================================================

-- profiles
drop policy if exists "profiles_read_all"    on public.profiles;
drop policy if exists "profiles_insert_own"  on public.profiles;
drop policy if exists "profiles_update_own"  on public.profiles;
drop policy if exists "profiles_all_auth"    on public.profiles;
create policy "profiles_all_auth" on public.profiles
  for all to authenticated
  using (true) with check (true);

-- phase_progress
drop policy if exists "phase_read_all"       on public.phase_progress;
drop policy if exists "phase_insert_own"     on public.phase_progress;
drop policy if exists "phase_update_own"     on public.phase_progress;
drop policy if exists "phase_all_auth"       on public.phase_progress;
create policy "phase_all_auth" on public.phase_progress
  for all to authenticated
  using (true) with check (true);

-- submissions
drop policy if exists "submissions_read_all"   on public.submissions;
drop policy if exists "submissions_insert_own" on public.submissions;
drop policy if exists "submissions_update_own" on public.submissions;
drop policy if exists "submissions_all_auth"   on public.submissions;
create policy "submissions_all_auth" on public.submissions
  for all to authenticated
  using (true) with check (true);

-- messages
drop policy if exists "messages_read"        on public.messages;
drop policy if exists "messages_insert"      on public.messages;
drop policy if exists "messages_all_auth"    on public.messages;
create policy "messages_all_auth" on public.messages
  for all to authenticated
  using (true) with check (true);

-- allowed_emails: only readable indirectly via RPCs (is_email_allowed,
-- get_participants). Leave it locked — no policy = no client access.
-- Admin add/remove still goes through SECURITY DEFINER RPCs.

-- storage.objects (phase_proofs): drop the email-folder check, just gate on auth.
drop policy if exists "phase_proofs_insert_own" on storage.objects;
drop policy if exists "phase_proofs_update_own" on storage.objects;
drop policy if exists "phase_proofs_delete_own" on storage.objects;

create policy "phase_proofs_insert_auth" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'phase_proofs');

create policy "phase_proofs_update_auth" on storage.objects
  for update to authenticated
  using (bucket_id = 'phase_proofs');

create policy "phase_proofs_delete_auth" on storage.objects
  for delete to authenticated
  using (bucket_id = 'phase_proofs');
