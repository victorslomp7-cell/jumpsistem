"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { uploadAttachment } from "@/lib/storage/attachments";
import type { MaintenanceEventType } from "@/types/domain";

export interface MaintenanceActionState {
  error?: string;
  success?: boolean;
}

function toNumberOrNull(value: FormDataEntryValue | null) {
  if (!value) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function createMaintenanceEvent(
  _prevState: MaintenanceActionState | undefined,
  formData: FormData
): Promise<MaintenanceActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Sessão expirada — faça login novamente." };

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  if (!vehicleId) return { error: "Selecione o veículo." };

  const type = String(formData.get("type") ?? "outro") as MaintenanceEventType;
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "Descreva o que foi feito." };

  const hoursAtEvent = toNumberOrNull(formData.get("hours_at_event"));
  if (type === "revisao" && hoursAtEvent === null) {
    return { error: "Informe as horas do motor no momento da revisão." };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("maintenance_events")
    .insert({
      vehicle_id: vehicleId,
      type,
      description,
      event_date: String(formData.get("event_date") ?? new Date().toISOString().slice(0, 10)),
      cost: toNumberOrNull(formData.get("cost")),
      budget: toNumberOrNull(formData.get("budget")),
      warranty_until: String(formData.get("warranty_until") ?? "").trim() || null,
      is_revision: type === "revisao",
      hours_at_event: hoursAtEvent,
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
        ownerType: "maintenance_event",
        ownerId: event.id,
        uploadedBy: current.userId,
      });
    } catch (err) {
      return { success: true, error: err instanceof Error ? `Anexo não enviado: ${err.message}` : undefined };
    }
  }

  revalidatePath("/maintenance");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/vehicles/${vehicleId}/maintenance`);
  revalidatePath(`/vehicles/${vehicleId}/hours`);
  revalidatePath("/alerts");
  revalidatePath("/dashboard");

  return { success: true };
}
