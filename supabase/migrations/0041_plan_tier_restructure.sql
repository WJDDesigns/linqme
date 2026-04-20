-- ============================================================================
-- linqme -- Restructure plan tiers: Free / Starter / Pro / Agency
-- Migration 0041
-- ============================================================================

-- Add new enum values to plan_tier (starter, pro, agency)
-- Postgres requires ALTER TYPE ... ADD VALUE for each new value.

alter type plan_tier add value if not exists 'starter' after 'free';
alter type plan_tier add value if not exists 'pro' after 'starter';
alter type plan_tier add value if not exists 'agency' after 'pro';

-- Migrate existing partners from old tier names to new ones:
--   paid     -> starter   (was the old paid tier)
--   unlimited -> agency   (unlimited was the old Agency equivalent)
--   enterprise -> agency

update public.partners set plan_tier = 'starter' where plan_tier = 'paid';
update public.partners set plan_tier = 'agency' where plan_tier = 'unlimited';
update public.partners set plan_tier = 'agency' where plan_tier = 'enterprise';

-- Update submissions_monthly_limit for free-tier partners
-- Old: 1 submission/mo -> New: 10 submissions/mo
update public.partners
set submissions_monthly_limit = 10
where plan_tier = 'free'
  and (submissions_monthly_limit is null or submissions_monthly_limit <= 1);

-- Update the bootstrap_account function to use new free-tier limit
create or replace function public.bootstrap_account(
  p_owner_id uuid,
  p_company_name text,
  p_slug citext,
  p_plan_type plan_type
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_partner_id uuid;
  v_tier plan_tier := 'free';
begin
  insert into public.partners (slug, name, plan_type, plan_tier, submissions_monthly_limit, created_by)
  values (p_slug, p_company_name, p_plan_type, v_tier,
          10,  -- Free tier: 10 submissions/month
          p_owner_id)
  returning id into v_partner_id;

  insert into public.partner_members (partner_id, user_id, role)
  values (v_partner_id, p_owner_id, 'partner_owner')
  on conflict do nothing;

  update public.profiles set role = 'partner_owner' where id = p_owner_id;

  return v_partner_id;
end $$;

-- Update plans table rows
-- Rename old starter slug to starter with new config
update public.plans set slug = 'starter', name = 'Starter', price_monthly = 3900,
  submissions_monthly_limit = 50, forms_limit = 5,
  features = '["Everything in Free","Up to 5 forms","50 submissions / month","10 GB storage","CSV & PDF exports","Email support"]'::jsonb
where slug in ('starter', 'standard');

-- Insert Starter plan if it doesn't exist
insert into public.plans (slug, name, price_monthly, submissions_monthly_limit, forms_limit, features, is_active, highlight, sort_order)
select 'starter', 'Starter', 3900, 50, 5,
  '["Everything in Free","Up to 5 forms","50 submissions / month","10 GB storage","CSV & PDF exports","Email support"]'::jsonb,
  true, false, 1
where not exists (select 1 from public.plans where slug = 'starter');

-- Update or insert Pro plan
update public.plans set name = 'Pro', price_monthly = 9900,
  submissions_monthly_limit = null, forms_limit = null,
  features = '["Everything in Starter","Unlimited forms","Unlimited submissions","100 GB storage","Full white-labeling","Custom domain"]'::jsonb,
  highlight = true, sort_order = 2
where slug = 'pro';

insert into public.plans (slug, name, price_monthly, submissions_monthly_limit, forms_limit, features, is_active, highlight, sort_order)
select 'pro', 'Pro', 9900, null, null,
  '["Everything in Starter","Unlimited forms","Unlimited submissions","100 GB storage","Full white-labeling","Custom domain"]'::jsonb,
  true, true, 2
where not exists (select 1 from public.plans where slug = 'pro');

-- Update Agency plan
update public.plans set price_monthly = 24900, sort_order = 3,
  features = '["Everything in Pro","Partner management","500 GB storage","Priority 24/7 support","SLA guarantee"]'::jsonb
where slug = 'agency';

-- Update Free plan limits
update public.plans set submissions_monthly_limit = 10,
  features = '["Your own branded workspace","1 form","Unlimited form fields","File uploads","1 GB storage","10 submissions / month"]'::jsonb
where slug = 'free';
