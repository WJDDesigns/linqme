-- Function to get last_sign_in_at for a list of user IDs
-- This is needed because auth.users is not directly queryable via the API
create or replace function public.get_users_last_sign_in(user_ids uuid[])
returns table (id uuid, last_sign_in_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select u.id, u.last_sign_in_at
  from auth.users u
  where u.id = any(user_ids);
$$;

-- Only service role can call this
revoke execute on function public.get_users_last_sign_in(uuid[]) from anon, authenticated;
grant execute on function public.get_users_last_sign_in(uuid[]) to service_role;
