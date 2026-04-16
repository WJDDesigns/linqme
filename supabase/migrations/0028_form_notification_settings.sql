-- Add per-form notification settings to partner_forms
-- Allows agencies to customize notification recipients, BCC, confirmation page,
-- and redirect URL for each form.

ALTER TABLE public.partner_forms
  ADD COLUMN IF NOT EXISTS notification_emails text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notification_bcc    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS confirm_page_heading text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confirm_page_body    text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS redirect_url         text DEFAULT NULL;

COMMENT ON COLUMN public.partner_forms.notification_emails IS 'Custom email recipients for submission notifications (overrides partner owner emails when set)';
COMMENT ON COLUMN public.partner_forms.notification_bcc    IS 'BCC email addresses for submission notifications';
COMMENT ON COLUMN public.partner_forms.confirm_page_heading IS 'Custom confirmation page heading shown after submission';
COMMENT ON COLUMN public.partner_forms.confirm_page_body    IS 'Custom confirmation page body text shown after submission';
COMMENT ON COLUMN public.partner_forms.redirect_url         IS 'URL to redirect to after form submission (overrides default confirm page)';
