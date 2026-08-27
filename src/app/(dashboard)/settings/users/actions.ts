"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/current-profile";
import type { ProfileRole } from "@/types/domain";

export async function setProfileRole(profileId: string, role: ProfileRole) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/users");
}

export async function setProfileActive(profileId: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ active }).eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/users");
}
