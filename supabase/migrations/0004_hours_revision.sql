-- Fase 3 — horas de motor e alertas de revisão.
--
-- IMPORTANTE: este arquivo tem duas partes que devem ser coladas e
-- executadas SEPARADAMENTE no SQL Editor (rode a Parte 1 inteira, espere
-- terminar, depois rode a Parte 2). Isso é de propósito: a Parte 2 usa a
-- extensão pg_cron, que em alguns projetos precisa ser habilitada primeiro
-- em Database → Extensions — se a Parte 2 falhar, a Parte 1 (tabelas,
-- triggers de tempo real) já fica valendo mesmo assim.

-- =============================================================
-- PARTE 1 — tabelas, e reavaliação em tempo real (sem depender de cron)
-- =============================================================

create table public.engine_hour_readings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  hours numeric(10,2) not null,
  read_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index engine_hour_readings_vehicle_read_at_idx
  on public.engine_hour_readings (vehicle_id, read_at desc);

create type public.maintenance_event_type as enum ('revisao', 'troca_peca', 'troca_bateria', 'outro');

-- Schema completo já pensado para a Fase 5 (histórico/anexos/orçamento);
-- aqui só é usado para registrar a conclusão de revisões (is_revision = true).
create table public.maintenance_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  type public.maintenance_event_type not null,
  description text not null,
  event_date date not null default current_date,
  cost numeric(12,2),
  budget numeric(12,2),
  warranty_until date,
  is_revision boolean not null default false,
  hours_at_event numeric(10,2),
  created_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index maintenance_events_vehicle_idx on public.maintenance_events (vehicle_id, event_date desc);

-- Reavalia o status de revisão de UM veículo (usado pelos triggers abaixo
-- e também pela varredura geral do cron, na Parte 2).
create function public.evaluate_vehicle_revision(p_vehicle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval numeric;
  v_warning numeric;
  v_hours_at_last_revision numeric;
  v_current_hours numeric;
  v_hours_since numeric;
  v_hours_until numeric;
begin
  select revision_interval_hours, revision_warning_hours
    into v_interval, v_warning
    from public.vehicles where id = p_vehicle_id;

  if v_interval is null then
    return; -- veículo sem regra de revisão configurada
  end if;

  select hours_at_event into v_hours_at_last_revision
    from public.maintenance_events
    where vehicle_id = p_vehicle_id and is_revision = true and hours_at_event is not null
    order by hours_at_event desc
    limit 1;
  v_hours_at_last_revision := coalesce(v_hours_at_last_revision, 0);

  select hours into v_current_hours
    from public.engine_hour_readings
    where vehicle_id = p_vehicle_id
    order by read_at desc
    limit 1;

  if v_current_hours is null then
    return; -- ainda sem nenhuma leitura de horas
  end if;

  v_hours_since := v_current_hours - v_hours_at_last_revision;
  v_hours_until := v_interval - v_hours_since;

  if v_hours_until <= 0 then
    if not exists (
      select 1 from public.alerts
      where vehicle_id = p_vehicle_id and type = 'revision_overdue' and status = 'open'
    ) then
      update public.alerts set status = 'resolved', resolved_at = now()
        where vehicle_id = p_vehicle_id and type = 'revision_due' and status = 'open';
      insert into public.alerts (vehicle_id, type, severity, message, status)
      values (
        p_vehicle_id, 'revision_overdue', 'critical',
        format('Revisão vencida — %s horas desde a última revisão (limite: %s horas).', v_hours_since, v_interval),
        'open'
      );
    end if;
  elsif v_warning is not null and v_hours_until <= v_warning then
    if not exists (
      select 1 from public.alerts
      where vehicle_id = p_vehicle_id and type in ('revision_due', 'revision_overdue') and status = 'open'
    ) then
      insert into public.alerts (vehicle_id, type, severity, message, status)
      values (
        p_vehicle_id, 'revision_due', 'warning',
        format('Revisão próxima — faltam %s horas.', v_hours_until),
        'open'
      );
    end if;
  else
    update public.alerts set status = 'resolved', resolved_at = now()
      where vehicle_id = p_vehicle_id and type in ('revision_due', 'revision_overdue') and status = 'open';
  end if;
end;
$$;

create function public.handle_engine_hour_reading()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.evaluate_vehicle_revision(new.vehicle_id);
  return new;
end;
$$;

create trigger on_engine_hour_reading_insert
  after insert on public.engine_hour_readings
  for each row execute function public.handle_engine_hour_reading();

-- Registrar uma revisão move o marco (hours_at_event) — reavalia na hora.
create function public.handle_maintenance_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_revision then
    perform public.evaluate_vehicle_revision(new.vehicle_id);
  end if;
  return new;
end;
$$;

create trigger on_maintenance_event_insert
  after insert on public.maintenance_events
  for each row execute function public.handle_maintenance_event_insert();

-- Admin mudando o intervalo/aviso de revisão do veículo também reavalia na hora.
create function public.handle_vehicle_revision_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revision_interval_hours is distinct from old.revision_interval_hours
     or new.revision_warning_hours is distinct from old.revision_warning_hours then
    perform public.evaluate_vehicle_revision(new.id);
  end if;
  return new;
end;
$$;

create trigger on_vehicle_revision_settings_update
  after update on public.vehicles
  for each row execute function public.handle_vehicle_revision_settings_update();

-- Varredura de todos os veículos — usada pelo cron (Parte 2) como rede de
-- segurança, e pode ser chamada manualmente a qualquer momento:
--   select public.check_all_revision_alerts();
create function public.check_all_revision_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  for v in select id from public.vehicles where revision_interval_hours is not null loop
    perform public.evaluate_vehicle_revision(v.id);
  end loop;
end;
$$;

alter table public.engine_hour_readings enable row level security;
alter table public.maintenance_events enable row level security;

create policy "engine_hour_readings: qualquer usuário autenticado lê"
  on public.engine_hour_readings for select
  using (auth.uid() is not null);

create policy "engine_hour_readings: usuário autenticado lança sua própria leitura"
  on public.engine_hour_readings for insert
  with check (auth.uid() is not null and recorded_by = auth.uid());

create policy "maintenance_events: qualquer usuário autenticado lê"
  on public.maintenance_events for select
  using (auth.uid() is not null);

create policy "maintenance_events: usuário autenticado lança em seu nome"
  on public.maintenance_events for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "maintenance_events: só admin edita/remove"
  on public.maintenance_events for update
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "maintenance_events: só admin remove"
  on public.maintenance_events for delete
  using (public.current_profile_role() = 'admin');

-- =============================================================
-- PARTE 2 — cole e rode SEPARADAMENTE depois da Parte 1 acima.
-- Rede de segurança diária via pg_cron (os triggers da Parte 1 já cobrem o
-- caso comum de "acabou de lançar horas"; isto aqui é só para não depender
-- só disso, ex.: o relógio do servidor passar da hora sem nenhum lançamento
-- novo). Se "create extension pg_cron" der erro de permissão, habilite a
-- extensão "pg_cron" em Database → Extensions no painel e rode de novo.
-- =============================================================

-- create extension if not exists pg_cron;
--
-- do $outer$
-- begin
--   if not exists (select 1 from cron.job where jobname = 'revision-alerts-daily') then
--     perform cron.schedule(
--       'revision-alerts-daily',
--       '0 6 * * *',
--       $cron$select public.check_all_revision_alerts();$cron$
--     );
--   end if;
-- end;
-- $outer$;
