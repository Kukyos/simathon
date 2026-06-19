-- ============================================================
-- Migration 004: storage bucket for phase proof uploads.
-- Run in Supabase SQL editor after 003.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('phase_proofs', 'phase_proofs', true)
on conflict (id) do nothing;

-- Anyone allowlisted can read (so admins + peers can verify).
create policy "phase_proofs_read"
  on storage.objects for select
  using (bucket_id = 'phase_proofs');

-- Authenticated users can upload only into their own email folder.
create policy "phase_proofs_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'phase_proofs'
    and auth.role() = 'authenticated'
    and lower((storage.foldername(name))[1]) = lower(auth.jwt() ->> 'email')
  );

-- Owners can replace/delete their own uploads.
create policy "phase_proofs_update_own"
  on storage.objects for update
  using (
    bucket_id = 'phase_proofs'
    and lower((storage.foldername(name))[1]) = lower(auth.jwt() ->> 'email')
  );

create policy "phase_proofs_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'phase_proofs'
    and lower((storage.foldername(name))[1]) = lower(auth.jwt() ->> 'email')
  );
