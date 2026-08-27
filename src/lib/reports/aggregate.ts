/**
 * Agregações de custo — puras, sem I/O, para serem testadas isoladamente
 * (Vitest) e reaproveitadas pelas telas de dashboard/relatórios (Fase 6).
 * Dataset esperado é pequeno (frota de uma empresa só), então agregação em
 * memória no servidor é suficiente — sem necessidade de view/materialização
 * no banco por enquanto.
 *
 * Abastecimento foi removido do sistema — todo custo aqui é de manutenção.
 */

import type { VehicleType } from "@/types/domain";

export function totalMaintenanceCost(events: { cost: number | null }[]): number {
  return events.reduce((sum, e) => sum + (e.cost ?? 0), 0);
}

export interface MonthlyCost {
  month: string; // "YYYY-MM"
  cost: number;
}

export function monthlyCosts(events: { event_date: string; cost: number | null }[]): MonthlyCost[] {
  const map = new Map<string, MonthlyCost>();
  const ensure = (month: string) => {
    if (!map.has(month)) map.set(month, { month, cost: 0 });
    return map.get(month)!;
  };

  for (const e of events) ensure(e.event_date.slice(0, 7)).cost += e.cost ?? 0;

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface MonthlyMaintenanceByType {
  month: string;
  jet_ski: number;
  lancha: number;
  outro: number;
}

export function monthlyMaintenanceByVehicleType(
  events: { event_date: string; cost: number | null; vehicle_id: string }[],
  vehicleTypeById: Map<string, VehicleType>
): MonthlyMaintenanceByType[] {
  const map = new Map<string, MonthlyMaintenanceByType>();
  const ensure = (month: string) => {
    if (!map.has(month)) map.set(month, { month, jet_ski: 0, lancha: 0, outro: 0 });
    return map.get(month)!;
  };

  for (const e of events) {
    const type = vehicleTypeById.get(e.vehicle_id) ?? "outro";
    ensure(e.event_date.slice(0, 7))[type] += e.cost ?? 0;
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface MaintenanceProgressionPoint {
  date: string; // "YYYY-MM-DD" — data do evento que mudou o acumulado
  jet_ski: number;
  lancha: number;
  outro: number;
}

/**
 * Custo de manutenção acumulado ao longo do tempo, por tipo de veículo —
 * visão alternativa "progressão" (igual à tendência de bateria: uma linha
 * contínua por série, jet ski e lancha em cores diferentes) ao gráfico
 * padrão por mês. Cada ponto é um "degrau" (o acumulado sobe no dia de cada
 * evento; entre eventos o valor considerado é o do último ponto).
 */
export function maintenanceProgressionByVehicleType(
  events: { event_date: string; cost: number | null; vehicle_id: string }[],
  vehicleTypeById: Map<string, VehicleType>
): MaintenanceProgressionPoint[] {
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const running = { jet_ski: 0, lancha: 0, outro: 0 };
  const byDate = new Map<string, MaintenanceProgressionPoint>();

  for (const e of sorted) {
    const type = vehicleTypeById.get(e.vehicle_id) ?? "outro";
    running[type] += e.cost ?? 0;
    byDate.set(e.event_date, { date: e.event_date, ...running });
  }

  return [...byDate.values()];
}

export interface VehicleCostSummary {
  vehicleId: string;
  totalMaintenance: number;
  revisionCount: number;
}

export function vehicleCostSummaries(
  vehicleIds: string[],
  events: { vehicle_id: string; cost: number | null; is_revision: boolean }[]
): Map<string, VehicleCostSummary> {
  const map = new Map<string, VehicleCostSummary>();
  for (const id of vehicleIds) {
    map.set(id, { vehicleId: id, totalMaintenance: 0, revisionCount: 0 });
  }

  for (const e of events) {
    const s = map.get(e.vehicle_id);
    if (!s) continue;
    s.totalMaintenance += e.cost ?? 0;
    if (e.is_revision) s.revisionCount += 1;
  }

  return map;
}
