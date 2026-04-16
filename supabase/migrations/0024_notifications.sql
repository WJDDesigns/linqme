-- In-app notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by user, ordered by recency
create index idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- Index for unread count queries
create index idx_notifications_user_unread
  on public.notifications (user_id)
  where read = false;

-- RLS
alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role inserts (no insert policy needed for anon/authenticated;
-- server actions use the admin client which bypasses RLS)
