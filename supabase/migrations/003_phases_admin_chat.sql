-- ============================================================
-- Migration 003: profiles, phases, admin actions, rate-limited chat.
-- Run AFTER 001_schema.sql and 002_participants.sql.
-- ============================================================

-- 1. Admins flagged on allowed_emails.
alter table public.allowed_emails
  add column if not exists is_admin boolean default false;

-- 2. Profile data captured at onboarding.
create table if not exists public.profiles (
  user_email text primary key,
  full_name text not null,
  platform text check (platform in ('windows','mac','linux','other')),
  has_gpu boolean,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_all" on public.profiles
  for select using (public.is_allowlisted());

create policy "profiles_insert_own" on public.profiles
  for insert with check (lower(user_email) = lower(auth.jwt() ->> 'email'));

create policy "profiles_update_own" on public.profiles
  for update using (lower(user_email) = lower(auth.jwt() ->> 'email'));

-- 3. Per-phase progress (2 phases by default; add more by widening the check).
create table if not exists public.phase_progress (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  phase int not null check (phase between 1 and 3),
  proof_url text,
  caption text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  unique (user_email, phase)
);
create index if not exists phase_progress_status_idx on public.phase_progress (status);

alter table public.phase_progress enable row level security;

create policy "phase_read_all" on public.phase_progress
  for select using (public.is_allowlisted());

create policy "phase_insert_own" on public.phase_progress
  for insert with check (lower(user_email) = lower(auth.jwt() ->> 'email'));

create policy "phase_update_own" on public.phase_progress
  for update using (lower(user_email) = lower(auth.jwt() ->> 'email'));

-- 4. Admin: review a phase submission.
create or replace function public.review_phase(target_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden: admins only';
  end if;
  if new_status not in ('pending','approved','rejected') then
    raise exception 'invalid status';
  end if;
  update public.phase_progress
  set status = new_status,
      reviewed_at = now(),
      reviewed_by = auth.jwt() ->> 'email'
  where id = target_id;
end;
$$;
grant execute on function public.review_phase(uuid, text) to authenticated;

-- 5. Admin: add a participant.
create or replace function public.admin_add_participant(p_email text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  insert into public.allowed_emails (email, full_name)
  values (lower(p_email), p_name)
  on conflict (email) do update set full_name = excluded.full_name;
end;
$$;
grant execute on function public.admin_add_participant(text, text) to authenticated;

-- 6. Admin: remove a participant (cleans up profile + phases + submission too).
create or replace function public.admin_remove_participant(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  delete from public.phase_progress where lower(user_email) = lower(p_email);
  delete from public.submissions    where lower(user_email) = lower(p_email);
  delete from public.profiles       where lower(user_email) = lower(p_email);
  delete from public.allowed_emails where lower(email)      = lower(p_email);
end;
$$;
grant execute on function public.admin_remove_participant(text) to authenticated;

-- 7. Admin: toggle admin flag.
create or replace function public.admin_set_admin(p_email text, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  update public.allowed_emails set is_admin = p_is_admin where lower(email) = lower(p_email);
end;
$$;
grant execute on function public.admin_set_admin(text, boolean) to authenticated;

-- 8. Quick admin check for the UI.
create or replace function public.am_i_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  );
$$;
grant execute on function public.am_i_admin() to authenticated;

-- 9. Chat: store admin flag on the message + post via rate-limited RPC.
alter table public.messages
  add column if not exists is_admin boolean default false;

create or replace function public.post_message(p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_email text := lower(auth.jwt() ->> 'email');
  my_admin boolean;
  my_name text;
  last_msg timestamptz;
begin
  if not exists (select 1 from public.allowed_emails where lower(email) = my_email) then
    raise exception 'not_allowlisted';
  end if;

  select coalesce(is_admin, false) into my_admin
  from public.allowed_emails where lower(email) = my_email;

  -- 5 second rate limit for everyone (admins exempt).
  if not coalesce(my_admin, false) then
    select max(created_at) into last_msg
    from public.messages where lower(user_email) = my_email;
    if last_msg is not null and now() - last_msg < interval '5 seconds' then
      raise exception 'rate_limited';
    end if;
  end if;

  if length(coalesce(p_content,'')) = 0 or length(p_content) > 2000 then
    raise exception 'invalid_length';
  end if;

  select coalesce(full_name, split_part(my_email, '@', 1))
    into my_name
    from public.profiles where lower(user_email) = my_email;
  if my_name is null then my_name := split_part(my_email, '@', 1); end if;

  insert into public.messages (user_email, display_name, content, is_admin)
  values (my_email, my_name, p_content, coalesce(my_admin, false));
end;
$$;
grant execute on function public.post_message(text) to authenticated;

-- 10. Replace get_participants with the richer version.
drop function if exists public.get_participants();
create or replace function public.get_participants()
returns table (
  email text,
  full_name text,
  platform text,
  has_gpu boolean,
  is_admin boolean,
  last_sign_in_at timestamptz,
  phase1_status text,
  phase2_status text,
  phases_complete int,
  submission_id uuid,
  submission_title text
)
language sql
security definer
set search_path = public, auth
as $$
  select
    a.email,
    coalesce(p.full_name, a.full_name)            as full_name,
    p.platform,
    p.has_gpu,
    coalesce(a.is_admin, false)                   as is_admin,
    u.last_sign_in_at,
    p1.status                                     as phase1_status,
    p2.status                                     as phase2_status,
    (
      (case when p1.status = 'approved' then 1 else 0 end) +
      (case when p2.status = 'approved' then 1 else 0 end)
    )                                             as phases_complete,
    s.id                                          as submission_id,
    s.title                                       as submission_title
  from public.allowed_emails a
  left join public.profiles p     on lower(p.user_email)  = lower(a.email)
  left join auth.users u          on lower(u.email)       = lower(a.email)
  left join public.phase_progress p1 on lower(p1.user_email) = lower(a.email) and p1.phase = 1
  left join public.phase_progress p2 on lower(p2.user_email) = lower(a.email) and p2.phase = 2
  left join public.submissions s   on lower(s.user_email)  = lower(a.email)
  order by u.last_sign_in_at desc nulls last, a.email;
$$;
grant execute on function public.get_participants() to authenticated;

-- 11. Mark first admin (replace with your email then run).
-- update public.allowed_emails set is_admin = true
-- where lower(email) = 'amohamedarmaan@gmail.com';
