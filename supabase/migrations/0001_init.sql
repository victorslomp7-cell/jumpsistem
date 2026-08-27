-- Fase 0/1 — schema inicial: perfis e veículos.
-- As demais tabelas (battery_readings, engine_hour_readings, refuels,
-- maintenance_events, attachments, alerts, push_subscriptions, app_settings)
-- chegam em migrations subsequentes (0002+), uma por fase, conforme o
-- roadmap do plano em /root/.claude/plans/dazzling-snuggling-ocean.md.

create extension if not exists "pgcrypto";

create type public.profile_role as enum ('admin', 'funcionario');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.profile_role not null default 'funcionario',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create type public.vehicle_type as enum ('jet_ski', 'lancha', 'outro');
create type public.vehicle_status as enum ('disponivel', 'bloqueado', 'manutencao');

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  type public.vehicle_type not null,
  model text,
  plate text,
  year int,
  photo_url text,
  -- Configurável por veículo (defaults aplicados na UI: 50h/10h jet ski,
  -- 100h/20h lancha; "outro" fica em branco até o admin definir).
  revision_interval_hours numeric,
  revision_warning_hours numeric,
  battery_check_frequency_days int,
  status public.vehicle_status not null default 'disponivel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper de RLS: papel do usuário autenticado.
create function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;

create policy "profiles: usuário vê o próprio perfil ou admin vê todos"
  on public.profiles for select
  using (id = auth.uid() or public.current_profile_role() = 'admin');

create policy "profiles: só admin gerencia perfis"
  on public.profiles for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "vehicles: qualquer usuário autenticado ativo pode ler"
  on public.vehicles for select
  using (auth.uid() is not null);

create policy "vehicles: só admin cria/edita/remove"
  on public.vehicles for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');
