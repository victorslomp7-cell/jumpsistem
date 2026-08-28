"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/current-profile";

export interface BatteryActionState {
  error?: string;
  success?: boolean;
}

function revalidateBatteryViews(vehicleId: string) {
  revalidatePath(`/vehicles/${vehicleId}/battery`);
  revalidatePath("/battery");
  revalidatePath("/dashboard");
  revalidatePath("/alerts");
}

/**
 * Corrigir uma leitura já lançada (ex.: erro de digitação) — admin-only,
 * mesmo padrão de "editar" já usado em maintenance_events (0004). Só
 * expõe voltage/notes: data/hora e veículo da leitura nunca mudam aqui.
 * O trigger `handle_battery_reading` (0003/0010) reavalia o bloqueio <12V
 * no banco se a leitura corrigida for a mais recente do veículo.
 */
export async function updateBatteryReading(
  readingId: string,
  vehicleId: string,
  _prevState: BatteryActionState | undefined,
  formData: FormData
): Promise<BatteryActionState> {
  await requireAdmin();

  const voltageRaw = formData.get("voltage");
  const voltage = Number(voltageRaw);
  if (!voltageRaw || Number.isNaN(voltage) || voltage <= 0) {
    return { error: "Informe uma voltagem válida." };
  }

  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("battery_readings")
    .update({ voltage, notes })
    .eq("id", readingId);

  if (error) return { error: `Erro ao salvar: ${error.message}` };

  revalidateBatteryViews(vehicleId);
  return { success: true };
}

/**
 * Excluir uma leitura já lançada (ex.: lançamento duplicado/errado) —
 * admin-only, mesmo padrão de "maintenance_events: só admin remove"
 * (0004). Se a leitura excluída era a mais recente do veículo, o trigger
 * `handle_battery_reading_delete` (0011) reavalia o bloqueio <12V/alerta
 * no banco a partir da leitura que sobrou.
 */
export async function deleteBatteryReading(
  readingId: string,
  vehicleId: string
): Promise<BatteryActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("battery_readings").delete().eq("id", readingId);

  if (error) return { error: `Erro ao excluir: ${error.message}` };

  revalidateBatteryViews(vehicleId);
  return { success: true };
}
