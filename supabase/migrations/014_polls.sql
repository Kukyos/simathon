-- Polls: admin asks a yes/no question during the meeting, students vote live.
-- Same shape as chat: open RLS to authenticated, realtime publication, direct inserts.

create table if not exists public.polls (
  id bigint primary key generated always as identity,
  question text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.poll_votes (
  poll_id bigint not null references public.polls(id) on delete cascade,
  user_email text not null,
  choice text not null check (choice in ('yes','no')),
  created_at timestamptz not null default now(),
  primary key (poll_id, user_email)
);

alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;

do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
           where schemaname='public' and tablename in ('polls','poll_votes')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy polls_open on public.polls
  for all to authenticated using (true) with check (true);

create policy poll_votes_open on public.poll_votes
  for all to authenticated using (true) with check (true);

-- Realtime: both tables in the publication, full replica identity so DELETE/UPDATE payloads carry the old row.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='polls') then
    execute 'alter publication supabase_realtime add table public.polls';
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='poll_votes') then
    execute 'alter publication supabase_realtime add table public.poll_votes';
  end if;
end $$;

alter table public.polls replica identity full;
alter table public.poll_votes replica identity full;
