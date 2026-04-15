-- Multi-form support: allow partners to have multiple forms
-- Free tier: 1 form, Nova: 10 forms, Supernova: unlimited

-- Add metadata columns to partner_forms so each form has its own identity
ALTER TABLE partner_forms
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Onboarding Form',
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Backfill: mark all existing active forms as defaults and generate slugs
UPDATE partner_forms SET is_default = true, slug = 'default' WHERE is_active = true AND slug IS NULL;
UPDATE partner_forms SET slug = 'form-' || substr(id::text, 1, 8) WHERE slug IS NULL;

-- Now make slug NOT NULL
ALTER TABLE partner_forms ALTER COLUMN slug SET NOT NULL;

-- Unique slug per partner (a partner can't have two forms with the same slug)
CREATE UNIQUE INDEX IF NOT EXISTS partner_forms_partner_slug_idx ON partner_forms(partner_id, slug);

-- Add forms_limit to plans table (NULL = unlimited)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS forms_limit integer;

-- Set form limits per plan tier
UPDATE plans SET forms_limit = 1 WHERE slug = 'free';
UPDATE plans SET forms_limit = 10 WHERE slug = 'pro';
UPDATE plans SET forms_limit = NULL WHERE slug = 'enterprise';

-- Junction table: assign forms to partners (many-to-many)
-- This lets a workspace owner assign their forms to specific sub-partners
CREATE TABLE IF NOT EXISTS form_partner_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_form_id uuid NOT NULL REFERENCES partner_forms(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partner_form_id, partner_id)
);

-- RLS for form_partner_assignments
ALTER TABLE form_partner_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their partner's form assignments"
  ON form_partner_assignments FOR SELECT
  USING (
    partner_id IN (
      SELECT pm.partner_id FROM partner_members pm WHERE pm.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM partner_members pm WHERE pm.user_id = auth.uid() AND pm.role = 'partner_owner')
  );

-- Add form_slug to submissions so we can track which form a submission came from
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS form_slug text;

-- Backfill existing submissions with 'default'
UPDATE submissions SET form_slug = 'default' WHERE form_slug IS NULL AND partner_form_id IS NOT NULL;
