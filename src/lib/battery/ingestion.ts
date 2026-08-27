/**
 * Abstração de ingestão de leitura de bateria.
 *
 * Motivo: hoje a única fonte é o funcionário lançando a leitura manualmente.
 * A Motorlog (rastreador usado pela empresa) não tem API/webhook público
 * documentado (pesquisado em 2026-08 — ver histórico da conversa). Caso uma
 * parceria/API surja no futuro, basta implementar `MotorlogApiAdapter` e
 * plugar aqui — o schema (`battery_readings.source`) e a UI não mudam.
 *
 * Implementação real (gravação no Supabase, trigger de bloqueio <12V) entra
 * na Fase 2.
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

  async ingest(input: BatteryReadingInput): Promise<BatteryReading> {
    throw new Error(`ManualBatteryReadingAdapter: implementado na Fase 2 (veículo ${input.vehicleId})`);
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
