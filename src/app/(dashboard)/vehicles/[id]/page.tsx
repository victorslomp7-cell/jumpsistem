import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import { VEHICLE_TYPE_LABELS, type Vehicle } from "@/types/domain";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [current, { data, error }] = await Promise.all([
    getCurrentProfile(),
    (await createClient()).from("vehicles").select("*").eq("id", id).maybeSingle(),
  ]);

  if (error || !data) notFound();
  const vehicle = data as Vehicle;
  const isAdmin = current?.profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{vehicle.nickname}</h1>
          <p className="text-sm text-muted-foreground">
            {VEHICLE_TYPE_LABELS[vehicle.type]} {vehicle.model ? `— ${vehicle.model}` : ""}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/vehicles/${vehicle.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Editar
            </Link>
            <DeleteVehicleButton vehicleId={vehicle.id} />
          </div>
        )}
      </div>

      <VehicleTabs vehicleId={vehicle.id} active="" />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          <Info label="Status" value={<VehicleStatusBadge status={vehicle.status} />} />
          <Info label="Placa/registro" value={vehicle.plate ?? "—"} />
          <Info label="Ano" value={vehicle.year ?? "—"} />
          <Info
            label="Intervalo de revisão"
            value={vehicle.revision_interval_hours ? `${vehicle.revision_interval_hours}h` : "—"}
          />
          <Info
            label="Aviso de revisão"
            value={vehicle.revision_warning_hours ? `${vehicle.revision_warning_hours}h antes` : "—"}
          />
          {vehicle.type === "jet_ski" && (
            <Info
              label="Frequência de leitura de bateria"
              value={
                vehicle.battery_check_frequency_days
                  ? `a cada ${vehicle.battery_check_frequency_days} dia(s)`
                  : "—"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
