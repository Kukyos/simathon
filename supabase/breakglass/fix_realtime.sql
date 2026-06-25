-- Run when other sessions stop seeing new chat messages live.
-- Idempotent.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

alter table public.messages replica identity full;

-- Verify:
select * from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
