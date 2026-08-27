import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import type { Vehicle } from "@/types/domain";
import { updateVehicle } from "../../actions";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect(`/vehicles/${id}`);
  }

  const { data } = await (await createClient()).from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar {(data as Vehicle).nickname}</h1>
      <VehicleForm vehicle={data as Vehicle} action={updateVehicle.bind(null, id)} />
    </div>
  );
}
