"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/current-profile";
import { vehicleFormSchema } from "@/lib/vehicles/schema";

export interface VehicleActionState {
  error?: string;
}

function parseVehicleForm(formData: FormData) {
  const raw = {
    nickname: formData.get("nickname"),
    type: formData.get("type"),
    model: formData.get("model") || undefined,
    plate: formData.get("plate") || undefined,
    year: formData.get("year") || undefined,
    revision_interval_hours: formData.get("revision_interval_hours") || undefined,
    revision_warning_hours: formData.get("revision_warning_hours") || undefined,
    battery_check_frequency_days: formData.get("battery_check_frequency_days") || undefined,
  };
  return vehicleFormSchema.safeParse(raw);
}

export async function createVehicle(
  _prevState: VehicleActionState | undefined,
  formData: FormData
): Promise<VehicleActionState> {
  await requireAdmin();

  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert(parsed.data);

  if (error) {
    return { error: `Erro ao salvar: ${error.message}` };
  }

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function updateVehicle(
  vehicleId: string,
  _prevState: VehicleActionState | undefined,
  formData: FormData
): Promise<VehicleActionState> {
  await requireAdmin();

  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", vehicleId);

  if (error) {
    return { error: `Erro ao salvar: ${error.message}` };
  }

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  redirect(`/vehicles/${vehicleId}`);
}

export async function deleteVehicle(vehicleId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    throw new Error(`Erro ao excluir: ${error.message}`);
  }

  revalidatePath("/vehicles");
  redirect("/vehicles");
}
