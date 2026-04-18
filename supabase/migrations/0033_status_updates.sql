-- Status updates for the public status page
create table if not exists public.status_updates (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  severity   text not null default 'info' check (severity in ('operational', 'degraded', 'partial_outage', 'major_outage', 'maintenance', 'info')),
  component  text not null default 'platform' check (component in ('platform', 'api', 'database', 'storage', 'authentication', 'email', 'forms')),
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for public status page queries
create index if not exists status_updates_active_idx
  on public.status_updates (is_resolved, created_at desc);

-- RLS: public read, superadmin write
alter table public.status_updates enable row level security;

create policy "Anyone can view status updates"
  on public.status_updates for select
  using (true);

create policy "Superadmins can manage status updates"
  on public.status_updates for all
  using (is_superadmin())
  with check (is_superadmin());
