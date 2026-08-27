"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export interface HoursActionState {
  error?: string;
  success?: boolean;
}

function revalidateVehicle(vehicleId: string) {
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/vehicles/${vehicleId}/hours`);
  revalidatePath("/vehicles");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}

export async function addHourReading(
  vehicleId: string,
  _prevState: HoursActionState | undefined,
  formData: FormData
): Promise<HoursActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Sessão expirada — faça login novamente." };

  const hoursRaw = formData.get("hours");
  const hours = Number(hoursRaw);
  if (!hoursRaw || Number.isNaN(hours) || hours < 0) {
    return { error: "Informe um número de horas válido." };
  }

  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  const supabase = await createClient();
  const { error } = await supabase.from("engine_hour_readings").insert({
    vehicle_id: vehicleId,
    hours,
    recorded_by: current.userId,
    notes,
  });

  if (error) return { error: error.message };

  revalidateVehicle(vehicleId);
  return { success: true };
}

export async function completeRevision(
  vehicleId: string,
  _prevState: HoursActionState | undefined,
  formData: FormData
): Promise<HoursActionState> {
  const current = await getCurrentProfile();
  if (!current) return { error: "Sessão expirada — faça login novamente." };

  const hoursAtEventRaw = formData.get("hours_at_event");
  const hoursAtEvent = Number(hoursAtEventRaw);
  if (!hoursAtEventRaw || Number.isNaN(hoursAtEvent) || hoursAtEvent < 0) {
    return { error: "Informe as horas do motor no momento da revisão." };
  }

  const description = String(formData.get("description") ?? "").trim() || "Revisão periódica";
  const costRaw = formData.get("cost");
  const cost = costRaw ? Number(costRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_events").insert({
    vehicle_id: vehicleId,
    type: "revisao",
    description,
    cost,
    is_revision: true,
    hours_at_event: hoursAtEvent,
    created_by: current.userId,
    notes,
  });

  if (error) return { error: error.message };

  revalidateVehicle(vehicleId);
  return { success: true };
}
