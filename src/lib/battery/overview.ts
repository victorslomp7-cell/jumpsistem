/**
 * Visão geral de bateria — matriz veículo x dia (uma leitura por dia por
 * veículo), pro gestor bater o olho e ver quem está com bateria baixa nos
 * últimos dias, no formato da planilha que a empresa já usa hoje.
 *
 * Puro/sem I/O (mesmo padrão de src/lib/reports/aggregate.ts) — a busca no
 * Supabase fica na página, aqui só a montagem da matriz, testável isolado.
 */

import { isBatteryLow } from "@/lib/battery/ingestion";

/** Empresa opera no Brasil — bucketiza por dia civil nesse fuso, não o do
 *  servidor (Vercel roda em UTC), pra não jogar uma leitura de fim de dia
 *  pro dia seguinte. */
export const FLEET_TIMEZONE = "America/Sao_Paulo";

/** "YYYY-MM-DD" do instante `iso`, no fuso informado. */
export function toDateKeyInTimezone(iso: string, timeZone: string = FLEET_TIMEZONE): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone });
}

/** Últimos `n` dias civis (incluindo hoje), em ordem crescente. */
export function lastNDateKeys(n: number, now: Date = new Date(), timeZone: string = FLEET_TIMEZONE): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    keys.push(toDateKeyInTimezone(d.toISOString(), timeZone));
  }
  return keys;
}

export interface BatteryOverviewCell {
  date: string; // "YYYY-MM-DD"
  voltage: number | null; // null = sem leitura nesse dia
  low: boolean; // voltage não-nulo e < BATTERY_MIN_VOLTAGE
}

export interface BatteryOverviewRow {
  vehicleId: string;
  nickname: string;
  cells: BatteryOverviewCell[];
}

/**
 * Monta a matriz. Quando há mais de uma leitura no mesmo dia pro mesmo
 * veículo, usa a mais recente (mesmo critério que o trigger de bloqueio no
 * banco usa pra decidir o status atual).
 */
export function buildBatteryOverview(
  vehicles: { id: string; nickname: string }[],
  readings: { vehicle_id: string; voltage: number; read_at: string }[],
  dateKeys: string[],
  timeZone: string = FLEET_TIMEZONE
): BatteryOverviewRow[] {
  const latestByVehicleDay = new Map<string, { voltage: number; read_at: string }>();

  for (const r of readings) {
    const day = toDateKeyInTimezone(r.read_at, timeZone);
    const key = `${r.vehicle_id}__${day}`;
    const current = latestByVehicleDay.get(key);
    if (!current || new Date(r.read_at).getTime() > new Date(current.read_at).getTime()) {
      latestByVehicleDay.set(key, { voltage: r.voltage, read_at: r.read_at });
    }
  }

  return vehicles
    .map((v) => ({
      vehicleId: v.id,
      nickname: v.nickname,
      cells: dateKeys.map((date): BatteryOverviewCell => {
        const found = latestByVehicleDay.get(`${v.id}__${date}`);
        return {
          date,
          voltage: found ? found.voltage : null,
          low: found ? isBatteryLow(found.voltage) : false,
        };
      }),
    }))
    .sort((a, b) => a.nickname.localeCompare(b.nickname, "pt-BR"));
}
