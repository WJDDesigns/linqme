-- Add success page customization columns to partner_forms
-- These columns were referenced in the form editor page but missing from the schema,
-- causing all form detail pages to 404.
ALTER TABLE public.partner_forms
  ADD COLUMN IF NOT EXISTS success_heading text,
  ADD COLUMN IF NOT EXISTS success_message text,
  ADD COLUMN IF NOT EXISTS success_redirect_url text;
