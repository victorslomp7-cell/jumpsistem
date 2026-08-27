"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { uploadAttachment } from "@/lib/storage/attachments";
import type { PaymentMethod } from "@/types/domain";

export interface RefuelActionState {
  error?: string;
  success?: boolean;
}

function toNumberOrNull(value: FormDataEntryValue | null) {
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function createRefuel(
  _prevState: RefuelActionState | undefined,
  formData: FormData
): Promise<RefuelActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Sessão expirada — faça login novamente." };

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "Selecione o veículo." };

  const liters = toNumberOrNull(formData.get("liters"));
  const totalValue = toNumberOrNull(formData.get("total_value"));
  if (!liters || liters <= 0) return { error: "Informe os litros abastecidos." };
  if (!totalValue || totalValue <= 0) return { error: "Informe o valor total." };

  const paymentMethodRaw = String(formData.get("payment_method") ?? "");
  const paymentMethod = (paymentMethodRaw || null) as PaymentMethod | null;

  const supabase = await createClient();
  const { data: refuel, error } = await supabase
    .from("refuels")
    .insert({
      vehicle_id: vehicleId,
      refuel_date: String(formData.get("refuel_date") ?? new Date().toISOString().slice(0, 10)),
      engine_hours: toNumberOrNull(formData.get("engine_hours")),
      fuel_type: String(formData.get("fuel_type") ?? "Gasolina comum").trim() || "Gasolina comum",
      liters,
      price_per_liter: toNumberOrNull(formData.get("price_per_liter")),
      total_value: totalValue,
      gas_station: String(formData.get("gas_station") ?? "").trim() || null,
      full_tank: formData.get("full_tank") === "on",
      payment_method: paymentMethod,
      driver_name: String(formData.get("driver_name") ?? "").trim() || null,
      created_by: current.userId,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    try {
      await uploadAttachment(supabase, {
        file,
        ownerType: "refuel",
        ownerId: refuel.id,
        uploadedBy: current.userId,
      });
    } catch (err) {
      // O abastecimento já foi salvo; só o anexo falhou — não perde o lançamento por isso.
      return { success: true, error: err instanceof Error ? `Anexo não enviado: ${err.message}` : undefined };
    }
  }

  revalidatePath("/refuels");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/vehicles/${vehicleId}/refuels`);
  revalidatePath("/dashboard");

  return { success: true };
}
