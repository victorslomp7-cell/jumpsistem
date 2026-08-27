-- Fase 2 — controle de bateria: leituras, alertas, e a regra crítica de
-- bloqueio automático (<12V) vivendo no banco (não só no app), conforme
-- decisão do cliente.
--
-- `alert_type` já inclui 'revision_due'/'revision_overdue' (usados só a
-- partir da Fase 3): Postgres não permite usar um valor de enum recém-criado
-- na mesma transação em que ele foi adicionado via ALTER TYPE, então é mais
-- simples declarar o conjunto completo aqui do que lidar com isso em 0004.

create type public.battery_reading_source as enum ('manual', 'motorlog_api');

create table public.battery_readings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  voltage numeric(4,2) not null,
  read_at timestamptz not null default now(),
  source public.battery_reading_source not null default 'manual',
  recorded_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index battery_readings_vehicle_read_at_idx
  on public.battery_readings (vehicle_id, read_at desc);

create type public.alert_type as enum ('battery_low', 'revision_due', 'revision_overdue');
create type public.alert_severity as enum ('info', 'warning', 'critical');
create type public.alert_status as enum ('open', 'acknowledged', 'resolved');

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles (id) on delete cascade,
  type public.alert_type not null,
  severity public.alert_severity not null default 'warning',
  message text not null,
  status public.alert_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index alerts_status_idx on public.alerts (status);
create index alerts_vehicle_idx on public.alerts (vehicle_id);

-- Regra crítica: toda nova leitura de bateria decide se o veículo fica
-- bloqueado. `security definer` faz os UPDATEs em vehicles/alerts rodarem
-- como o dono da função (bypassa RLS), igual ao padrão já usado em
-- current_profile_role() (0001) — a leitura em si (INSERT em
-- battery_readings) continua sujeita à policy normal do funcionário.
create function public.handle_battery_reading()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.vehicle_status;
begin
  -- Ignora leituras lançadas fora de ordem (retroativas) — só a leitura
  -- mais recente do veículo deve decidir o status atual.
  if exists (
    select 1 from public.battery_readings
    where vehicle_id = new.vehicle_id and read_at > new.read_at and id <> new.id
  ) then
    return new;
  end if;

  select status into v_status from public.vehicles where id = new.vehicle_id;

  if new.voltage < 12 then
    -- Não sobrescreve um status de "manutencao" definido manualmente.
    if v_status = 'disponivel' then
      update public.vehicles set status = 'bloqueado', updated_at = now() where id = new.vehicle_id;
    end if;

    if not exists (
      select 1 from public.alerts
      where vehicle_id = new.vehicle_id and type = 'battery_low' and status = 'open'
    ) then
      insert into public.alerts (vehicle_id, type, severity, message, status)
      values (
        new.vehicle_id,
        'battery_low',
        'critical',
        format('Bateria abaixo de 12V (%sV) — veículo bloqueado.', new.voltage),
        'open'
      );
    end if;
  else
    if v_status = 'bloqueado' then
      update public.vehicles set status = 'disponivel', updated_at = now() where id = new.vehicle_id;
    end if;

    update public.alerts
      set status = 'resolved', resolved_at = now()
      where vehicle_id = new.vehicle_id and type = 'battery_low' and status = 'open';
  end if;

  return new;
end;
$$;

create trigger on_battery_reading_insert
  after insert on public.battery_readings
  for each row execute function public.handle_battery_reading();

alter table public.battery_readings enable row level security;
alter table public.alerts enable row level security;

create policy "battery_readings: qualquer usuário autenticado lê"
  on public.battery_readings for select
  using (auth.uid() is not null);

create policy "battery_readings: usuário autenticado lança sua própria leitura"
  on public.battery_readings for insert
  with check (auth.uid() is not null and recorded_by = auth.uid());

create policy "alerts: qualquer usuário autenticado lê"
  on public.alerts for select
  using (auth.uid() is not null);

create policy "alerts: qualquer usuário autenticado reconhece/resolve"
  on public.alerts for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
