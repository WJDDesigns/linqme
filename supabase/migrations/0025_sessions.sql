create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ip_address text,
  user_agent text,
  device_name text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  is_current boolean not null default false
);

create index idx_user_sessions_user_id on public.user_sessions(user_id);

-- RLS
alter table public.user_sessions enable row level security;

create policy "Users can view own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);
