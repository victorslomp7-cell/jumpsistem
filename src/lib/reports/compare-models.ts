/**
 * Comparacao entre modelos de veiculo (jet ski vs lancha, "Sea-Doo GTI 170"
 * vs "NHD 260" etc.) - puro, sem I/O, testavel isoladamente. Reaproveita o
 * mesmo principio do resto de src/lib/reports/: agregacao em memoria,
 * dataset pequeno o suficiente pra nao precisar de view no banco.
 */

import type { VehicleType } from "@/types/domain";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Veiculos sem "model" preenchido entram agrupados por tipo, nao somem da comparacao. */
export function modelGroupKey(vehicle: { model: string | null; type: VehicleType }): string {
  return vehicle.model?.trim() || `${vehicle.type} (sem modelo)`;
}

export interface ModelComparisonRow {
  model: string;
  vehicleType: VehicleType;
  vehicleCount: number;
  totalMaintenanceCost: number;
  avgMaintenanceCostPerVehicle: number;
  avgHours: number | null;
  costPerHour: number | null;
  batteryLowRatePercent: number | null;
  avgDaysBetweenRevisions: number | null;
  revisionCount: number;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function compareVehiclesByModel(
  vehicles: { id: string; model: string | null; type: VehicleType }[],
  hourReadings: { vehicle_id: string; hours: number; read_at: string }[],
  batteryReadings: { vehicle_id: string; voltage: number }[],
  maintenanceEvents: { vehicle_id: string; cost: number | null; is_revision: boolean; event_date: string }[]
): ModelComparisonRow[] {
  const latestHoursByVehicle = new Map<string, number>();
  const latestReadAtByVehicle = new Map<string, string>();
  for (const r of hourReadings) {
    const prevReadAt = latestReadAtByVehicle.get(r.vehicle_id);
    if (!prevReadAt || r.read_at > prevReadAt) {
      latestReadAtByVehicle.set(r.vehicle_id, r.read_at);
      latestHoursByVehicle.set(r.vehicle_id, r.hours);
    }
  }

  const batteryTotalByVehicle = new Map<string, number>();
  const batteryLowByVehicle = new Map<string, number>();
  for (const b of batteryReadings) {
    batteryTotalByVehicle.set(b.vehicle_id, (batteryTotalByVehicle.get(b.vehicle_id) ?? 0) + 1);
    if (b.voltage < 12) batteryLowByVehicle.set(b.vehicle_id, (batteryLowByVehicle.get(b.vehicle_id) ?? 0) + 1);
  }

  const costByVehicle = new Map<string, number>();
  const revisionCountByVehicle = new Map<string, number>();
  const revisionDatesByVehicle = new Map<string, string[]>();
  for (const e of maintenanceEvents) {
    costByVehicle.set(e.vehicle_id, (costByVehicle.get(e.vehicle_id) ?? 0) + (e.cost ?? 0));
    if (e.is_revision) {
      revisionCountByVehicle.set(e.vehicle_id, (revisionCountByVehicle.get(e.vehicle_id) ?? 0) + 1);
      const list = revisionDatesByVehicle.get(e.vehicle_id) ?? [];
      list.push(e.event_date);
      revisionDatesByVehicle.set(e.vehicle_id, list);
    }
  }

  const avgIntervalDaysByVehicle = new Map<string, number>();
  for (const [vehicleId, dates] of revisionDatesByVehicle) {
    const sorted = [...dates].sort();
    if (sorted.length < 2) continue;
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalDays += (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / MS_PER_DAY;
    }
    avgIntervalDaysByVehicle.set(vehicleId, totalDays / (sorted.length - 1));
  }

  const buckets = new Map<string, { type: VehicleType; vehicleIds: string[] }>();
  for (const v of vehicles) {
    const key = modelGroupKey(v);
    const bucket = buckets.get(key) ?? { type: v.type, vehicleIds: [] };
    bucket.vehicleIds.push(v.id);
    buckets.set(key, bucket);
  }

  const rows: ModelComparisonRow[] = [];
  for (const [model, bucket] of buckets) {
    const { vehicleIds } = bucket;
    const totalMaintenanceCost = vehicleIds.reduce((sum, id) => sum + (costByVehicle.get(id) ?? 0), 0);
    const revisionCount = vehicleIds.reduce((sum, id) => sum + (revisionCountByVehicle.get(id) ?? 0), 0);

    const hoursValues = vehicleIds
      .map((id) => latestHoursByVehicle.get(id))
      .filter((h): h is number => h !== undefined);
    const totalHours = hoursValues.reduce((a, b) => a + b, 0);

    const batteryTotal = vehicleIds.reduce((sum, id) => sum + (batteryTotalByVehicle.get(id) ?? 0), 0);
    const batteryLow = vehicleIds.reduce((sum, id) => sum + (batteryLowByVehicle.get(id) ?? 0), 0);

    const intervalValues = vehicleIds
      .map((id) => avgIntervalDaysByVehicle.get(id))
      .filter((n): n is number => n !== undefined);

    rows.push({
      model,
      vehicleType: bucket.type,
      vehicleCount: vehicleIds.length,
      totalMaintenanceCost,
      avgMaintenanceCostPerVehicle: totalMaintenanceCost / vehicleIds.length,
      avgHours: average(hoursValues),
      costPerHour: totalHours > 0 ? totalMaintenanceCost / totalHours : null,
      batteryLowRatePercent: batteryTotal > 0 ? (batteryLow / batteryTotal) * 100 : null,
      avgDaysBetweenRevisions: average(intervalValues),
      revisionCount,
    });
  }

  return rows.sort((a, b) => b.totalMaintenanceCost - a.totalMaintenanceCost);
}

export interface PeriodModelCost {
  period: string;
  model: string;
  cost: number;
}

export function costByPeriodAndModel(
  events: { event_date: string; cost: number | null; vehicle_id: string }[],
  modelByVehicleId: Map<string, string>,
  granularity: "month" | "year"
): PeriodModelCost[] {
  const sliceLength = granularity === "month" ? 7 : 4;
  const byPeriod = new Map<string, Map<string, number>>();

  for (const e of events) {
    const period = e.event_date.slice(0, sliceLength);
    const model = modelByVehicleId.get(e.vehicle_id) ?? "outro";
    const byModel = byPeriod.get(period) ?? new Map<string, number>();
    byModel.set(model, (byModel.get(model) ?? 0) + (e.cost ?? 0));
    byPeriod.set(period, byModel);
  }

  const rows: PeriodModelCost[] = [];
  for (const [period, byModel] of byPeriod) {
    for (const [model, cost] of byModel) {
      rows.push({ period, model, cost });
    }
  }

  return rows.sort((a, b) => a.period.localeCompare(b.period) || a.model.localeCompare(b.model));
}
