-- ============================================================
-- Migration 007: re-ensure messages realtime + better display_name fallback.
-- ============================================================

-- 1. Make damn sure messages is in the realtime publication.
--    `alter ... add table` errors if already a member, so we guard it.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- 2. REPLICA IDENTITY FULL so postgres_changes payloads include all columns.
alter table public.messages replica identity full;

-- 3. post_message: if profiles.full_name is missing, fall back to allowed_emails.full_name
--    before defaulting to the email prefix.
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

  -- 5 second rate limit for everyone, admins exempt.
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

  -- Name priority: profile → allowed_emails roster → email prefix.
  select nullif(full_name, '') into my_name
    from public.profiles where lower(user_email) = my_email;
  if my_name is null then
    select nullif(full_name, '') into my_name
      from public.allowed_emails where lower(email) = my_email;
  end if;
  if my_name is null then
    my_name := split_part(my_email, '@', 1);
  end if;

  insert into public.messages (user_email, display_name, content, is_admin)
  values (my_email, my_name, p_content, coalesce(my_admin, false));
end;
$$;
grant execute on function public.post_message(text) to authenticated;
