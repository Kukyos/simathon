-- ============================================================
-- Migration 008: stop gating chat on allowed_emails. Any signed-in user can post.
-- Saves a support thread when someone whose email isn't on the roster tries to chat.
-- Rate limit + admin flag still work.
-- ============================================================

drop function if exists public.post_message(text);
create function public.post_message(p_content text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  my_email text := lower(auth.jwt() ->> 'email');
  my_admin boolean;
  my_name text;
  last_msg timestamptz;
  new_id bigint;
begin
  if my_email is null or my_email = '' then
    raise exception 'not_signed_in';
  end if;

  -- is_admin pulled from allowed_emails IF the row exists; otherwise false.
  select coalesce(is_admin, false) into my_admin
  from public.allowed_emails where lower(email) = my_email;
  my_admin := coalesce(my_admin, false);

  -- 5 second rate limit, admins exempt.
  if not my_admin then
    select max(created_at) into last_msg
    from public.messages where lower(user_email) = my_email;
    if last_msg is not null and now() - last_msg < interval '5 seconds' then
      raise exception 'rate_limited';
    end if;
  end if;

  if length(coalesce(p_content,'')) = 0 or length(p_content) > 2000 then
    raise exception 'invalid_length';
  end if;

  -- Name: profile → roster → email prefix.
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
  values (my_email, my_name, p_content, my_admin)
  returning id into new_id;

  return new_id;
end;
$$;
grant execute on function public.post_message(text) to authenticated;
