-- ============================================================
-- Migration 022: approved phase proofs get deleted + chat lock.
--
-- 1. Once a phase 1/2 submission is APPROVED, its screenshot is
--    deleted from storage and proof_url nulled. Verified = done;
--    no need to keep the file. (Main hackathon submissions are
--    untouched — this only applies to the phase_proofs bucket.)
--    Applies to review_phase, admin_set_phase, and
--    admin_approve_all_pending.
-- 2. Chat lock: admins can freeze the chat (app_config.chat_locked).
--    Enforced by a trigger on messages insert, so the direct-insert
--    path the chat UI uses is covered too.
--
-- Run in Supabase SQL editor after 021. Idempotent.
-- ============================================================

-- ---------- 1a. shared proof-file cleanup ----------
create or replace function public._delete_phase_proof(p_email text, p_phase int)
returns void
language sql
security definer
set search_path = public
as $$
  delete from storage.objects
  where bucket_id = 'phase_proofs'
    and (storage.foldername(name))[1] = lower(p_email)
    and name like '%/phase' || p_phase || '.%';
$$;
-- internal helper only
revoke execute on function public._delete_phase_proof(text, int) from public, anon, authenticated;

-- ---------- 1b. review_phase: wipe the file on approve ----------
create or replace function public.review_phase(target_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
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
      reviewed_by = auth.jwt() ->> 'email',
      proof_url = case when new_status = 'approved' then null else proof_url end
  where id = target_id
  returning user_email, phase into r;
  if new_status = 'approved' and r.user_email is not null then
    perform public._delete_phase_proof(r.user_email, r.phase);
  end if;
end;
$$;
grant execute on function public.review_phase(uuid, text) to authenticated;

-- ---------- 1c. admin_set_phase: same cleanup on force-approve ----------
create or replace function public.admin_set_phase(p_email text, p_phase int, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e text := lower(trim(p_email));
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;
  if p_phase not between 1 and 3 then
    raise exception 'invalid_phase';
  end if;

  if p_status = 'none' then
    delete from public.phase_progress
    where lower(user_email) = e and phase = p_phase;
    perform public._delete_phase_proof(e, p_phase);
    return;
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid_status';
  end if;

  insert into public.phase_progress (user_email, phase, status, caption, reviewed_at, reviewed_by)
  values (e, p_phase, p_status, 'force-set by admin', now(), auth.jwt() ->> 'email')
  on conflict (user_email, phase) do update set
    status = excluded.status,
    reviewed_at = now(),
    reviewed_by = excluded.reviewed_by;

  if p_status = 'approved' then
    update public.phase_progress set proof_url = null
    where lower(user_email) = e and phase = p_phase;
    perform public._delete_phase_proof(e, p_phase);
  end if;
end;
$$;
grant execute on function public.admin_set_phase(text, int, text) to authenticated;

-- ---------- 1d. approve-all: cleanup for every row it touches ----------
create or replace function public.admin_approve_all_pending()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'forbidden';
  end if;

  select count(*) into n from public.phase_progress where status = 'pending';

  with approved as (
    update public.phase_progress
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.jwt() ->> 'email',
        proof_url = null
    where status = 'pending'
    returning user_email, phase
  )
  delete from storage.objects o
  using approved a
  where o.bucket_id = 'phase_proofs'
    and (storage.foldername(o.name))[1] = lower(a.user_email)
    and o.name like '%/phase' || a.phase || '.%';

  return n;
end;
$$;
grant execute on function public.admin_approve_all_pending() to authenticated;

-- ---------- 2. chat lock ----------
alter table public.app_config
  add column if not exists chat_locked boolean not null default false;

create or replace function public.chat_locked()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select chat_locked from public.app_config where id = 1), false);
$$;
grant execute on function public.chat_locked() to anon, authenticated;

create or replace function public.admin_set_chat_locked(p_locked boolean)
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
  update public.app_config set chat_locked = p_locked where id = 1;
end;
$$;
grant execute on function public.admin_set_chat_locked(boolean) to authenticated;

-- Enforce at insert time: the chat UI inserts into messages directly,
-- so a trigger is the only choke point that covers every path.
create or replace function public.messages_check_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.chat_locked() and not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'chat_locked';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_chat_lock on public.messages;
create trigger messages_chat_lock
  before insert on public.messages
  for each row execute function public.messages_check_lock();
