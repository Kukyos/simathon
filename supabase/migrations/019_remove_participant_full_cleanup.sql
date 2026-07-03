-- ============================================================
-- Migration 019: admin_remove_participant now also deletes the
-- participant's storage files + chat messages, not just their rows.
--
-- Bug it fixes: removing an account left phase_proofs/submissions
-- files (and chat messages) orphaned. Storage never dropped.
-- Run in Supabase SQL editor after 018. Idempotent.
-- ============================================================

create or replace function public.admin_remove_participant(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(p_email);
  -- submissions bucket sanitizes the email the same way the client does.
  sub_folder text := regexp_replace(lower(p_email), '[^a-z0-9._-]', '_', 'gi');
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;

  delete from public.phase_progress where lower(user_email) = e;
  delete from public.submissions    where lower(user_email) = e;
  delete from public.profiles       where lower(user_email) = e;
  delete from public.messages       where lower(user_email) = e;

  -- ponytail: delete storage rows directly. This frees the bucket quota
  -- (usage is computed from storage.objects). If a future Supabase version
  -- leaves S3 orphans, run a storage-API purge; fine for a 1-week event.
  delete from storage.objects
    where bucket_id = 'phase_proofs' and lower(name) like e || '/%';
  delete from storage.objects
    where bucket_id = 'submissions'  and name like sub_folder || '/%';

  delete from public.allowed_emails where lower(email) = e;
end;
$$;

grant execute on function public.admin_remove_participant(text) to authenticated;
