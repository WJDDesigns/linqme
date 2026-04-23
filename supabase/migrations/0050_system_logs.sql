-- System logs for admin diagnostics
create table if not exists public.system_logs (
  id bigint generated always as identity primary key,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  category text not null default 'general',
  message text not null,
  metadata jsonb default '{}',
  partner_id uuid references public.partners(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Index for quick lookups
create index idx_system_logs_created_at on public.system_logs (created_at desc);
create index idx_system_logs_level on public.system_logs (level);
create index idx_system_logs_category on public.system_logs (category);

-- RLS: only service role can read/write
alter table public.system_logs enable row level security;

create policy "Service role manages system_logs"
  on public.system_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.system_logs is 'Platform-wide diagnostic logs for admin. Auto-purge older than 30 days.';
