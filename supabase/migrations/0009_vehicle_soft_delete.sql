-- "Remover" um veículo agora é um arquivamento (soft delete) — a linha
-- nunca é apagada de verdade, então battery_readings/engine_hour_readings/
-- maintenance_events/alerts (todos com "on delete cascade" pro vehicle_id)
-- nunca são atingidos por uma remoção de veículo. O dinheiro já gasto em
-- manutenção continua contando nos relatórios mesmo depois do veículo
-- sair da frota ativa.

alter table public.vehicles add column deleted_at timestamptz;

create index vehicles_deleted_at_idx on public.vehicles (deleted_at);
