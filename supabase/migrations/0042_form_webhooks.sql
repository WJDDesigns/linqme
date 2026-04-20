-- ============================================================================
-- linqme -- Form webhooks (Zapier, Make, custom endpoints)
-- Migration 0042
-- ============================================================================

-- Per-form webhook configurations
create table if not exists public.form_webhooks (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid not null references public.partners(id) on delete cascade,
  partner_form_id uuid not null references public.partner_forms(id) on delete cascade,
  name          text not null default 'Zapier',
  webhook_url   text not null,
  provider      text not null default 'zapier',  -- zapier, make, custom
  is_enabled    boolean not null default true,
  -- field_map: array of { fieldId, key, label } or null for "send all fields"
  field_map     jsonb,
  -- optional secret for HMAC signing (custom webhooks)
  signing_secret text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists form_webhooks_partner_form_idx
  on public.form_webhooks (partner_form_id);
create index if not exists form_webhooks_partner_idx
  on public.form_webhooks (partner_id);

-- Delivery log for debugging
create table if not exists public.webhook_deliveries (
  id             uuid primary key default gen_random_uuid(),
  webhook_id     uuid not null references public.form_webhooks(id) on delete cascade,
  submission_id  uuid not null references public.submissions(id) on delete cascade,
  status         text not null default 'pending',  -- pending, success, failed
  status_code    int,
  response_body  text,
  error_message  text,
  duration_ms    int,
  created_at     timestamptz not null default now()
);

create index if not exists webhook_deliveries_webhook_idx
  on public.webhook_deliveries (webhook_id);
create index if not exists webhook_deliveries_submission_idx
  on public.webhook_deliveries (submission_id);

-- RLS
alter table public.form_webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Partners can manage their own webhooks
create policy "Partners manage own webhooks"
  on public.form_webhooks for all
  using (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  )
  with check (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  );

-- Partners can view their own delivery logs
create policy "Partners view own deliveries"
  on public.webhook_deliveries for select
  using (
    exists (
      select 1 from public.form_webhooks w
      where w.id = webhook_deliveries.webhook_id
        and (public.is_partner_member(w.partner_id) or public.is_superadmin())
    )
  );

-- Superadmins can insert delivery logs (service role bypasses RLS anyway)
create policy "Service insert deliveries"
  on public.webhook_deliveries for insert
  with check (true);
