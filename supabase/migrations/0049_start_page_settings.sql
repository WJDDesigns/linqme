-- Start page customization for forms
-- Allows partners to customize the button text, description, or skip
-- the start page entirely and go straight to the form.

alter table public.partner_forms
  add column if not exists start_button_text text,
  add column if not exists start_description text,
  add column if not exists skip_start_page boolean not null default false;
