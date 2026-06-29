-- 017: like / dislike on submissions. One row per (sub, user) — like and dislike are mutually exclusive.

create table if not exists public.submission_reactions (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  user_email text not null,
  reaction text not null check (reaction in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key (submission_id, user_email)
);

alter table public.submission_reactions enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname='public' and tablename='submission_reactions'
  loop
    execute format('drop policy if exists %I on public.submission_reactions', p.policyname);
  end loop;
end $$;

create policy submission_reactions_open on public.submission_reactions
  for all to authenticated using (true) with check (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='submission_reactions') then
    execute 'alter publication supabase_realtime add table public.submission_reactions';
  end if;
end $$;

alter table public.submission_reactions replica identity full;
