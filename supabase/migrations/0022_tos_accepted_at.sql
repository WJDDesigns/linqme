-- Add TOS acceptance tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;

COMMENT ON COLUMN public.profiles.tos_accepted_at IS 'Timestamp when user accepted Terms of Service and Privacy Policy';
