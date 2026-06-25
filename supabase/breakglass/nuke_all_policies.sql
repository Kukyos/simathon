-- LAST RESORT. Drops every RLS policy on every public table this app uses, then
-- installs one open-to-authenticated policy per table. Same effect as migration 011.
-- Run when an RLS error appears out of nowhere.

do $$
declare
  t text;
  p record;
  tables text[] := array[
    'allowed_emails','messages','profiles','phase_progress','submissions'
  ];
begin
  foreach t in array tables loop
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_open', t
    );
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
