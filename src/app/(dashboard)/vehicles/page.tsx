import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { VehicleAlertBadges } from "@/components/vehicles/vehicle-alert-badges";
import { VEHICLE_TYPE_LABELS, type Alert, type Vehicle } from "@/types/domain";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const [current, vehiclesResult, { data: openAlerts }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("vehicles").select("*").order("nickname"),
    supabase.from("alerts").select("*").eq("status", "open"),
  ]);

  const isAdmin = current?.profile?.role === "admin";
  const vehicles = (vehiclesResult.data as Vehicle[] | null) ?? [];

  const alertsByVehicle = new Map<string, Alert[]>();
  for (const alert of (openAlerts as Alert[] | null) ?? []) {
    if (!alert.vehicle_id) continue;
    const list = alertsByVehicle.get(alert.vehicle_id) ?? [];
    list.push(alert);
    alertsByVehicle.set(alert.vehicle_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Veículos</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} veículo{vehicles.length === 1 ? "" : "s"} cadastrado
            {vehicles.length === 1 ? "" : "s"}
          </p>
        </div>
        {isAdmin && (
          <Link href="/vehicles/new" className={buttonVariants({})}>
            Novo veículo
          </Link>
        )}
      </div>

      {vehiclesResult.error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar veículos: {vehiclesResult.error.message}
        </Card>
      )}

      {vehicles.length === 0 && !vehiclesResult.error ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum veículo cadastrado ainda.
          {isAdmin && (
            <>
              {" "}
              <Link href="/vehicles/new" className="text-primary underline">
                Cadastre o primeiro
              </Link>
              .
            </>
          )}
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Apelido</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Modelo</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/vehicles/${vehicle.id}`} className="font-medium hover:underline">
                      {vehicle.nickname}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{VEHICLE_TYPE_LABELS[vehicle.type]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{vehicle.model ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <VehicleStatusBadge status={vehicle.status} />
                      <VehicleAlertBadges alerts={alertsByVehicle.get(vehicle.id) ?? []} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
