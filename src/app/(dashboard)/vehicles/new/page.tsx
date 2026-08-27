import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "../actions";

export default async function NewVehiclePage() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/vehicles");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Novo veículo</h1>
      <VehicleForm action={createVehicle} />
    </div>
  );
}
