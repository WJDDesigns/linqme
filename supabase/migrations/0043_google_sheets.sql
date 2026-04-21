-- ============================================================================
-- linqme -- Google Sheets native integration
-- Migration 0043
-- ============================================================================

-- Account-level Google Sheets OAuth connection (reuses Google Drive creds)
create table if not exists public.sheets_connections (
  id             uuid primary key default gen_random_uuid(),
  partner_id     uuid not null references public.partners(id) on delete cascade,
  account_email  text,
  access_token_encrypted  text not null,
  refresh_token_encrypted text not null,
  token_expires_at        timestamptz,
  scopes         text,
  connected_at   timestamptz not null default now()
);

create unique index if not exists sheets_connections_partner_idx
  on public.sheets_connections (partner_id);

-- Per-form Google Sheets feed (which spreadsheet, field mapping)
create table if not exists public.sheets_feeds (
  id               uuid primary key default gen_random_uuid(),
  partner_id       uuid not null references public.partners(id) on delete cascade,
  partner_form_id  uuid not null references public.partner_forms(id) on delete cascade,
  spreadsheet_id   text not null,
  spreadsheet_name text not null default '',
  sheet_name       text not null default 'Sheet1',
  -- field_map: array of { fieldId, column } or null for "auto-map all fields"
  field_map        jsonb,
  is_enabled       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists sheets_feeds_form_idx
  on public.sheets_feeds (partner_form_id);
create index if not exists sheets_feeds_partner_idx
  on public.sheets_feeds (partner_id);

-- RLS
alter table public.sheets_connections enable row level security;
alter table public.sheets_feeds enable row level security;

create policy "Partners manage own sheets connection"
  on public.sheets_connections for all
  using (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  )
  with check (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  );

create policy "Partners manage own sheets feeds"
  on public.sheets_feeds for all
  using (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  )
  with check (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  );
