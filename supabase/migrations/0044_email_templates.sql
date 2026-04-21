-- ============================================================================
-- linqme -- Per-form email template customization
-- Migration 0044
-- ============================================================================

-- Add email template columns to partner_forms.
-- NULL means "use default template". When set, the template body supports
-- merge tags like {all_fields}, {client_name}, {client_email}, {field:field_id}.

alter table public.partner_forms
  add column if not exists partner_email_subject text,
  add column if not exists partner_email_body    text,
  add column if not exists client_email_subject  text,
  add column if not exists client_email_body     text;

comment on column public.partner_forms.partner_email_subject is 'Custom subject line for admin/partner notification email. Supports merge tags.';
comment on column public.partner_forms.partner_email_body    is 'Custom HTML body for admin/partner notification email. Supports merge tags.';
comment on column public.partner_forms.client_email_subject  is 'Custom subject line for client confirmation email. Supports merge tags.';
comment on column public.partner_forms.client_email_body     is 'Custom HTML body for client confirmation email. Supports merge tags.';
