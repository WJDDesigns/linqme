-- AI provider integrations (OpenAI, Anthropic, Google AI)

create table if not exists public.ai_integrations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'google_ai')),
  api_key_encrypted text not null,
  model_preference text, -- e.g. 'gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.0-flash'
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, provider)
);

create index ai_integrations_partner_idx on public.ai_integrations(partner_id);

alter table public.ai_integrations enable row level security;

create policy ai_integrations_select on public.ai_integrations for select
  using (public.is_partner_member(partner_id) or public.is_superadmin());

create policy ai_integrations_insert on public.ai_integrations for insert
  with check (public.is_partner_member(partner_id) or public.is_superadmin());

create policy ai_integrations_update on public.ai_integrations for update
  using (public.is_partner_member(partner_id) or public.is_superadmin());

create policy ai_integrations_delete on public.ai_integrations for delete
  using (public.is_partner_member(partner_id) or public.is_superadmin());

create trigger set_updated_at before update on public.ai_integrations
  for each row execute function public.tg_set_updated_at();
