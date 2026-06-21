-- ============================================================
-- Migration 011: one rule for every public table. RLS on, single open
-- policy for authenticated. Auth is enforced in the app + SECURITY DEFINER
-- RPCs. Run this once and you should never hit an RLS surprise again.
-- ============================================================

do $$
declare
  t text;
  p record;
  tables text[] := array[
    'allowed_emails',
    'messages',
    'profiles',
    'phase_progress',
    'submissions'
  ];
begin
  foreach t in array tables loop
    -- drop every policy on this table, whatever its name
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t);
    end loop;

    -- install one open policy
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_open', t
    );

    -- make sure RLS is on (no orphan-deny)
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
