/**
 * Agregações de custo — puras, sem I/O, para serem testadas isoladamente
 * (Vitest) e reaproveitadas pelas telas de dashboard/relatórios (Fase 6).
 * Dataset esperado é pequeno (frota de uma empresa só), então agregação em
 * memória no servidor é suficiente — sem necessidade de view/materialização
 * no banco por enquanto.
 */

import type { VehicleType } from "@/types/domain";

export interface CostByCategory {
  refuels: number;
  maintenance: number;
}

export function totalCostByCategory(
  refuels: { total_value: number }[],
  events: { cost: number | null }[]
): CostByCategory {
  return {
    refuels: refuels.reduce((sum, r) => sum + r.total_value, 0),
    maintenance: events.reduce((sum, e) => sum + (e.cost ?? 0), 0),
  };
}

export interface MonthlyCost {
  month: string; // "YYYY-MM"
  refuels: number;
  maintenance: number;
}

export function monthlyCosts(
  refuels: { refuel_date: string; total_value: number }[],
  events: { event_date: string; cost: number | null }[]
): MonthlyCost[] {
  const map = new Map<string, MonthlyCost>();
  const ensure = (month: string) => {
    if (!map.has(month)) map.set(month, { month, refuels: 0, maintenance: 0 });
    return map.get(month)!;
  };

  for (const r of refuels) ensure(r.refuel_date.slice(0, 7)).refuels += r.total_value;
  for (const e of events) ensure(e.event_date.slice(0, 7)).maintenance += e.cost ?? 0;

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

export interface VehicleCostSummary {
  vehicleId: string;
  totalRefuels: number;
  totalMaintenance: number;
  total: number;
  revisionCount: number;
}

export function vehicleCostSummaries(
  vehicleIds: string[],
  refuels: { vehicle_id: string; total_value: number }[],
  events: { vehicle_id: string; cost: number | null; is_revision: boolean }[]
): Map<string, VehicleCostSummary> {
  const map = new Map<string, VehicleCostSummary>();
  for (const id of vehicleIds) {
    map.set(id, { vehicleId: id, totalRefuels: 0, totalMaintenance: 0, total: 0, revisionCount: 0 });
  }

  for (const r of refuels) {
    const s = map.get(r.vehicle_id);
    if (!s) continue;
    s.totalRefuels += r.total_value;
    s.total += r.total_value;
  }

  for (const e of events) {
    const s = map.get(e.vehicle_id);
    if (!s) continue;
    const cost = e.cost ?? 0;
    s.totalMaintenance += cost;
    s.total += cost;
    if (e.is_revision) s.revisionCount += 1;
  }

  return map;
}
