-- ============================================================================
-- linqme -- Multiple per-form email notifications with conditional routing
-- Migration 0045
-- ============================================================================

create table if not exists public.form_notifications (
  id               uuid primary key default gen_random_uuid(),
  partner_id       uuid not null references public.partners(id) on delete cascade,
  partner_form_id  uuid not null references public.partner_forms(id) on delete cascade,
  name             text not null default 'Admin Notification',
  is_enabled       boolean not null default true,
  -- Recipients
  to_emails        text[] not null default '{}',
  bcc_emails       text[] not null default '{}',
  reply_to         text,
  -- Template (merge tags supported)
  email_subject    text,
  email_body       text,
  -- Conditional logic: same shape as ShowCondition from forms.ts
  -- { fieldId, operator, value?, extraConditions?, combinator? }
  -- NULL means "always send"
  conditions       jsonb,
  -- Ordering
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists form_notifications_form_idx
  on public.form_notifications (partner_form_id);
create index if not exists form_notifications_partner_idx
  on public.form_notifications (partner_id);

-- RLS
alter table public.form_notifications enable row level security;

create policy "Partners manage own form notifications"
  on public.form_notifications for all
  using (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  )
  with check (
    public.is_partner_member(partner_id)
    or public.is_superadmin()
  );

-- Migrate existing notification data into the new table.
-- For every partner_form that has notification_emails set, create an
-- "Admin Notification" row. Also create a "Client Confirmation" row if
-- client_email_subject or client_email_body is set.

insert into public.form_notifications (partner_id, partner_form_id, name, is_enabled, to_emails, bcc_emails, email_subject, email_body, sort_order)
select
  pf.partner_id,
  pf.id,
  'Admin Notification',
  true,
  coalesce(pf.notification_emails, '{}'),
  coalesce(pf.notification_bcc, '{}'),
  pf.partner_email_subject,
  pf.partner_email_body,
  0
from public.partner_forms pf
where array_length(pf.notification_emails, 1) > 0
   or pf.partner_email_subject is not null
   or pf.partner_email_body is not null;

insert into public.form_notifications (partner_id, partner_form_id, name, is_enabled, to_emails, email_subject, email_body, sort_order)
select
  pf.partner_id,
  pf.id,
  'Client Confirmation',
  true,
  '{}',
  pf.client_email_subject,
  pf.client_email_body,
  1
from public.partner_forms pf
where pf.client_email_subject is not null
   or pf.client_email_body is not null;
