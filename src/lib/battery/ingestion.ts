import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Abstração de ingestão de leitura de bateria.
 *
 * Motivo: hoje a única fonte é o funcionário lançando a leitura manualmente.
 * A Motorlog (rastreador usado pela empresa) não tem API/webhook público
 * documentado (pesquisado em 2026-08 — ver histórico da conversa). Caso uma
 * parceria/API surja no futuro, basta implementar `MotorlogApiAdapter` e
 * plugar aqui — o schema (`battery_readings.source`) e a UI não mudam.
 *
 * A regra de bloqueio <12V é aplicada pelo trigger `handle_battery_reading`
 * no banco (`supabase/migrations/0003_battery.sql`), não aqui — isso garante
 * que ela vale para qualquer adapter (manual ou futuro Motorlog), não só
 * para quem passa pelo app.
 */

export type BatteryReadingSourceType = "manual" | "motorlog_api";

export interface BatteryReadingInput {
  vehicleId: string;
  voltage: number;
  readAt: string; // ISO 8601
  recordedBy?: string; // profile id, obrigatório para leituras manuais
  notes?: string;
}

export interface BatteryReading extends BatteryReadingInput {
  id: string;
  source: BatteryReadingSourceType;
}

export interface BatteryReadingSource {
  readonly type: BatteryReadingSourceType;
  ingest(input: BatteryReadingInput): Promise<BatteryReading>;
}

/** Único adapter ativo hoje: leitura feita manualmente por um funcionário. */
export class ManualBatteryReadingAdapter implements BatteryReadingSource {
  readonly type = "manual" as const;

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async ingest(input: BatteryReadingInput): Promise<BatteryReading> {
    if (!input.recordedBy) {
      throw new Error("recordedBy é obrigatório para leituras manuais.");
    }

    const { data, error } = await this.supabase
      .from("battery_readings")
      .insert({
        vehicle_id: input.vehicleId,
        voltage: input.voltage,
        read_at: input.readAt,
        recorded_by: input.recordedBy,
        notes: input.notes,
        source: "manual",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      vehicleId: data.vehicle_id,
      voltage: data.voltage,
      readAt: data.read_at,
      recordedBy: data.recorded_by ?? undefined,
      notes: data.notes ?? undefined,
      source: "manual",
    };
  }
}

/**
 * Stub — implementar somente quando/se a Motorlog disponibilizar uma API ou
 * parceria comercial documentada. Sem alterar a interface `BatteryReadingSource`
 * nem o schema, um cron/webhook chamaria `ingest` para cada leitura recebida.
 */
export class MotorlogApiAdapter implements BatteryReadingSource {
  readonly type = "motorlog_api" as const;

  async ingest(input: BatteryReadingInput): Promise<BatteryReading> {
    throw new Error(
      `MotorlogApiAdapter: não implementado — sem API pública documentada da Motorlog (veículo ${input.vehicleId}).`
    );
  }
}

/** Limite de tensão abaixo do qual o veículo é bloqueado (regra de negócio). */
export const BATTERY_MIN_VOLTAGE = 12;

export function isBatteryLow(voltage: number): boolean {
  return voltage < BATTERY_MIN_VOLTAGE;
}

/**
 * Espelha (para fins de UI otimista e teste) a decisão que o trigger
 * `handle_battery_reading` toma no banco — que é a fonte da verdade. Nunca
 * usar isto para decidir se o veículo pode operar; é só para a tela refletir
 * o resultado esperado antes do round-trip com o servidor.
 */
export function nextVehicleStatusAfterReading(
  currentStatus: "disponivel" | "bloqueado" | "manutencao",
  voltage: number
): "disponivel" | "bloqueado" | "manutencao" {
  if (currentStatus === "manutencao") return currentStatus;
  if (isBatteryLow(voltage)) return "bloqueado";
  if (currentStatus === "bloqueado") return "disponivel";
  return currentStatus;
}
