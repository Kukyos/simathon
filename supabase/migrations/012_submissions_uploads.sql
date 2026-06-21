-- ============================================================
-- Migration 012: native uploads for submissions (folder upload, mp4, screenshot).
-- No GitHub. No YouTube. Everything sits in our own storage.
-- ============================================================

-- 1. Submissions bucket. Public for read so the gallery just works.
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- 2. Nuke any old policies on storage.objects scoped to the new bucket, install
--    one open policy per action for authenticated users (auth in app).
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'submissions_%'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy "submissions_read"   on storage.objects for select to public          using (bucket_id = 'submissions');
create policy "submissions_insert" on storage.objects for insert to authenticated   with check (bucket_id = 'submissions');
create policy "submissions_update" on storage.objects for update to authenticated   using (bucket_id = 'submissions');
create policy "submissions_delete" on storage.objects for delete to authenticated   using (bucket_id = 'submissions');

-- 3. Submissions table: store the list of uploaded code files + clip + screenshot paths.
alter table public.submissions
  add column if not exists files jsonb default '[]'::jsonb;
-- screenshot_url + video_url already exist; we'll reuse them to hold public URLs
-- to the bucket-stored screenshot.png and clip.mp4. github_url stays nullable, unused.
