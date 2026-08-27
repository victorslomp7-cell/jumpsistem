-- Fase 7 — Web Push: onde as inscrições de notificação ficam guardadas.
-- O envio em si (POST /api/push/notify) é uma rota do próprio Next.js, não
-- uma Edge Function separada — configure um Database Webhook (Database →
-- Webhooks) na tabela `alerts`, evento INSERT, apontando pra
-- https://<seu-dominio>/api/push/notify, com o header
-- "x-webhook-secret: <PUSH_WEBHOOK_SECRET>" (mesmo valor do .env).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_label text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: usuário vê/gerencia as próprias"
  on public.push_subscriptions for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- A rota /api/push/notify usa a service role (bypassa RLS) pra ler todas as
-- inscrições e apagar as inválidas — não precisa de policy extra pra isso.
