-- Fase 8 (ajuste) — permitir corrigir uma leitura de bateria já lançada
-- (ex.: erro de digitação: 12.4 em vez de 12.43).
--
-- Até aqui battery_readings só tinha policy de select/insert (nenhuma de
-- update) — funcionário lança a leitura, mas corrigir um valor já gravado
-- é admin-only, mesmo padrão de "maintenance_events: só admin edita/remove"
-- (0004). RLS aqui só cobre "quem pode mexer na linha"; o app decide quais
-- colunas expõe pra edição (só voltage/notes — nunca vehicle_id/recorded_by).
create policy "battery_readings: só admin edita"
  on public.battery_readings for update
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

-- O trigger de bloqueio <12V (handle_battery_reading, 0003) só rodava em
-- INSERT. Sem isso, corrigir a leitura mais recente de um veículo (a que
-- decide o status atual) deixaria o status/alerta de bateria desatualizado
-- até a próxima leitura nova chegar. A função já trata corretamente o caso
-- de update (ela sempre confere se `new` ainda é a leitura mais recente
-- antes de agir), então basta religar o mesmo trigger também pra UPDATE.
create trigger on_battery_reading_update
  after update of voltage on public.battery_readings
  for each row execute function public.handle_battery_reading();
