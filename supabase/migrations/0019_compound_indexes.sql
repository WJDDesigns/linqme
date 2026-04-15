-- Compound indexes for common dashboard queries

-- Submissions: filtered by partner + status, sorted by created_at
CREATE INDEX IF NOT EXISTS idx_submissions_partner_status_created
  ON submissions (partner_id, status, created_at DESC);

-- Page views: partner analytics queries (last 30 days, etc.)
CREATE INDEX IF NOT EXISTS idx_page_views_partner_created
  ON page_views (partner_id, created_at DESC);

-- Form events: partner analytics funnel queries
CREATE INDEX IF NOT EXISTS idx_form_events_partner_created
  ON form_events (partner_id, created_at DESC);

-- Form events: event type filtering within partner
CREATE INDEX IF NOT EXISTS idx_form_events_partner_type
  ON form_events (partner_id, event_type, created_at DESC);

-- Partner forms: active forms lookup per partner
CREATE INDEX IF NOT EXISTS idx_partner_forms_partner_active
  ON partner_forms (partner_id, is_active) WHERE is_active = true;

-- Billing events: partner billing history
CREATE INDEX IF NOT EXISTS idx_billing_events_partner_created
  ON billing_events (partner_id, created_at DESC);
