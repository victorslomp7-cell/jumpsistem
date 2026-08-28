-- Fase 8 (ajuste) — permitir excluir uma leitura de bateria já lançada
-- (ex.: lançamento duplicado/errado), admin-only, mesmo padrão de
-- "maintenance_events: só admin remove" (0004).
create policy "battery_readings: só admin exclui"
  on public.battery_readings for delete
  using (public.current_profile_role() = 'admin');

-- Se a leitura excluída era a mais recente do veículo, o status
-- (bloqueado/disponível) e o alerta de bateria baixa ficam desatualizados
-- até a próxima leitura chegar — sem esse trigger, excluir a leitura que
-- causou (ou resolveu) um bloqueio deixaria o veículo "preso" no status
-- errado. Diferente de handle_battery_reading (que reage a NEW), aqui não
-- existe NEW — a função busca de novo qual é a leitura mais recente que
-- sobrou depois da exclusão e reavalia a partir dela.
create function public.handle_battery_reading_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.vehicle_status;
  v_latest_voltage numeric(4,2);
begin
  select status into v_status from public.vehicles where id = old.vehicle_id;

  select voltage into v_latest_voltage
  from public.battery_readings
  where vehicle_id = old.vehicle_id
  order by read_at desc
  limit 1;

  -- Não sobrescreve um status de "manutencao" definido manualmente, igual
  -- handle_battery_reading.
  if v_latest_voltage is null then
    -- Não sobrou nenhuma leitura: sem evidência de bateria baixa, libera
    -- o bloqueio (se houver) e resolve o alerta aberto.
    if v_status = 'bloqueado' then
      update public.vehicles set status = 'disponivel', updated_at = now() where id = old.vehicle_id;
    end if;

    update public.alerts
      set status = 'resolved', resolved_at = now()
      where vehicle_id = old.vehicle_id and type = 'battery_low' and status = 'open';

    return old;
  end if;

  if v_latest_voltage < 12 then
    if v_status = 'disponivel' then
      update public.vehicles set status = 'bloqueado', updated_at = now() where id = old.vehicle_id;
    end if;

    if not exists (
      select 1 from public.alerts
      where vehicle_id = old.vehicle_id and type = 'battery_low' and status = 'open'
    ) then
      insert into public.alerts (vehicle_id, type, severity, message, status)
      values (
        old.vehicle_id,
        'battery_low',
        'critical',
        format('Bateria abaixo de 12V (%sV) — veículo bloqueado.', v_latest_voltage),
        'open'
      );
    end if;
  else
    if v_status = 'bloqueado' then
      update public.vehicles set status = 'disponivel', updated_at = now() where id = old.vehicle_id;
    end if;

    update public.alerts
      set status = 'resolved', resolved_at = now()
      where vehicle_id = old.vehicle_id and type = 'battery_low' and status = 'open';
  end if;

  return old;
end;
$$;

create trigger on_battery_reading_delete
  after delete on public.battery_readings
  for each row execute function public.handle_battery_reading_delete();
