-- Payment provider integrations (Stripe, PayPal, Square)
create table if not exists public.payment_integrations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal', 'square')),
  api_key_encrypted text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, provider)
);

alter table public.payment_integrations enable row level security;

create policy "Partners can view own payment integrations"
  on public.payment_integrations for select
  using (partner_id in (
    select id from public.partners where owner_id = auth.uid()
    union
    select partner_id from public.partner_members where user_id = auth.uid()
  ));

-- Captcha / bot protection integrations (reCAPTCHA, Turnstile)
create table if not exists public.captcha_integrations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  provider text not null check (provider in ('recaptcha', 'turnstile')),
  site_key text not null,
  secret_key_encrypted text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, provider)
);

alter table public.captcha_integrations enable row level security;

create policy "Partners can view own captcha integrations"
  on public.captcha_integrations for select
  using (partner_id in (
    select id from public.partners where owner_id = auth.uid()
    union
    select partner_id from public.partner_members where user_id = auth.uid()
  ));
