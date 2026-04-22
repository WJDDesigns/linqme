-- Fix RLS policies from migration 0038 that used USING (true)
-- which allows ANY authenticated user full access to all rows.
-- Replace with proper service-role-only checks.
--
-- Supabase service role bypasses RLS entirely, so these policies
-- are actually unnecessary for the service role. The real fix is
-- to DROP these overly permissive policies so only the fine-grained
-- policies from earlier migrations apply to authenticated users.

-- 0001_init tables
drop policy if exists "Service role full access" on public.profiles;
drop policy if exists "Service role full access" on public.partners;
drop policy if exists "Service role full access" on public.partner_members;
drop policy if exists "Service role full access" on public.form_templates;
drop policy if exists "Service role full access" on public.partner_forms;
drop policy if exists "Service role full access" on public.submissions;
drop policy if exists "Service role full access" on public.submission_files;
drop policy if exists "Service role full access" on public.invites;
drop policy if exists "Service role full access" on public.events;

-- 0010_plans_table
drop policy if exists "Service role full access" on public.plans;

-- 0013_partner_invites
drop policy if exists "Service role full access" on public.form_change_requests;

-- 0015_multi_forms
drop policy if exists "Service role full access" on public.form_partner_assignments;

-- 0017_analytics
drop policy if exists "Service role full access" on public.page_views;
drop policy if exists "Service role full access" on public.form_events;

-- 0018_error_logs
drop policy if exists "Service role full access" on public.error_logs;

-- 0021_passkey_credentials
drop policy if exists "Service role full access" on public.user_passkeys;

-- 0024_notifications
drop policy if exists "Service role full access" on public.notifications;

-- 0025_sessions
drop policy if exists "Service role full access" on public.user_sessions;

-- 0030_cloud_integrations
drop policy if exists "Service role full access" on public.cloud_integrations;
drop policy if exists "Service role full access" on public.cloud_sync_log;

-- 0031_ai_integrations
drop policy if exists "Service role full access" on public.ai_integrations;

-- 0032_payment_captcha_integrations
drop policy if exists "Service role full access" on public.payment_integrations;
drop policy if exists "Service role full access" on public.captcha_integrations;

-- 0033_status_updates
drop policy if exists "Service role full access" on public.status_updates;

-- 0034_insight_dashboards
drop policy if exists "Service role full access" on public.insight_dashboards;

-- 0036_geocoding_integrations
drop policy if exists "Service role full access" on public.geocoding_integrations;
