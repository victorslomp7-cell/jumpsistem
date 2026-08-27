"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { ManualBatteryReadingAdapter } from "@/lib/battery/ingestion";

export interface BatteryActionState {
  error?: string;
  success?: boolean;
}

export async function addBatteryReading(
  vehicleId: string,
  _prevState: BatteryActionState | undefined,
  formData: FormData
): Promise<BatteryActionState> {
  const current = await getCurrentProfile();
  if (!current) {
    return { error: "Sessão expirada — faça login novamente." };
  }

  const voltageRaw = formData.get("voltage");
  const voltage = Number(voltageRaw);
  if (!voltageRaw || Number.isNaN(voltage)) {
    return { error: "Informe uma voltagem válida." };
  }

  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  const supabase = await createClient();
  const adapter = new ManualBatteryReadingAdapter(supabase);

  try {
    await adapter.ingest({
      vehicleId,
      voltage,
      readAt: new Date().toISOString(),
      recordedBy: current.userId,
      notes,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar leitura." };
  }

  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/vehicles/${vehicleId}/battery`);
  revalidatePath("/vehicles");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");

  return { success: true };
}
