"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AlertStatus } from "@/types/domain";

export async function setAlertStatus(alertId: string, status: AlertStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("alerts")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", alertId);

  if (error) throw new Error(error.message);

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}
