-- Insight dashboards — stores per-partner widget configurations
create table if not exists public.insight_dashboards (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null default 'My Dashboard',
  widgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each partner gets one default dashboard (can add more later)
create unique index if not exists idx_insight_dashboards_partner
  on public.insight_dashboards(partner_id, name);

create index if not exists idx_insight_dashboards_partner_id
  on public.insight_dashboards(partner_id);

-- RLS
alter table public.insight_dashboards enable row level security;

-- Partners can read/write their own dashboards
create policy "Partners can manage own dashboards"
  on public.insight_dashboards
  for all
  using (partner_id in (
    select id from public.partners where created_by = auth.uid()
    union
    select partner_id from public.partner_members where user_id = auth.uid()
  ))
  with check (partner_id in (
    select id from public.partners where created_by = auth.uid()
    union
    select partner_id from public.partner_members where user_id = auth.uid()
  ));

-- Superadmin full access
create policy "Superadmin full access to dashboards"
  on public.insight_dashboards
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
  );
