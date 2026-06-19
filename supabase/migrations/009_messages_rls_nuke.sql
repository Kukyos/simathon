-- ============================================================
-- Migration 009: nuke every policy on messages, install one open one.
-- ============================================================

-- Drop *every* existing policy on public.messages, whatever its name.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', p.policyname);
  end loop;
end $$;

-- One policy: any authenticated user can do anything.
create policy "messages_open" on public.messages
  for all to authenticated
  using (true) with check (true);

-- Make sure RLS is still on (it should be) but no orphan-deny.
alter table public.messages enable row level security;
