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

export interface ArchiveActionState {
  error?: string;
}

/**
 * "Remover" um veículo é sempre um soft delete (arquivamento) — nunca um
 * DELETE de verdade. Isso garante que battery_readings/engine_hour_readings/
 * maintenance_events/alerts (todos com `on delete cascade` pro vehicle_id)
 * nunca são atingidos: o histórico de manutenção já pago continua contando
 * nos relatórios mesmo depois do veículo sair da frota ativa.
 *
 * Confirmação por texto (o admin precisa digitar o apelido exato do
 * veículo) é revalidada aqui no servidor, não só no client — evita remoção
 * por engano mesmo que alguém adultere o formulário.
 */
export async function archiveVehicle(
  vehicleId: string,
  _prevState: ArchiveActionState | undefined,
  formData: FormData
): Promise<ArchiveActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", vehicleId).maybeSingle();
  if (!vehicle) return { error: "Veículo não encontrado." };

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== vehicle.nickname) {
    return { error: `Digite exatamente "${vehicle.nickname}" para confirmar.` };
  }

  const { error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", vehicleId);

  if (error) return { error: `Erro ao remover: ${error.message}` };

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath("/dashboard");
  redirect("/vehicles");
}

export async function reactivateVehicle(vehicleId: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update({ deleted_at: null }).eq("id", vehicleId);

  if (error) throw new Error(`Erro ao reativar: ${error.message}`);

  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
}
