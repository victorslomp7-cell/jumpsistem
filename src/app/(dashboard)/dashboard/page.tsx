import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { VehicleAlertBadges } from "@/components/vehicles/vehicle-alert-badges";
import { VEHICLE_TYPE_LABELS, type Alert, type Vehicle } from "@/types/domain";

/*
 * Dashboard geral. Custo total e gráficos mensais chegam na Fase 6
 * (Dashboards/Relatórios) — os cards abaixo já refletem dados reais de
 * veículos/alertas assim que existirem.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: openAlerts }] = await Promise.all([
    supabase.from("vehicles").select("*").order("nickname"),
    supabase.from("alerts").select("*").eq("status", "open"),
  ]);

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const blockedCount = vehicleList.filter((v) => v.status === "bloqueado").length;
  const openAlertsList = (openAlerts as Alert[] | null) ?? [];

  const alertsByVehicle = new Map<string, Alert[]>();
  for (const alert of openAlertsList) {
    if (!alert.vehicle_id) continue;
    const list = alertsByVehicle.get(alert.vehicle_id) ?? [];
    list.push(alert);
    alertsByVehicle.set(alert.vehicle_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Visão geral da frota</h1>
        <p className="text-sm text-muted-foreground">
          Custo total e gráficos mensais chegam na Fase 6 (Dashboards/Relatórios).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Veículos cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{vehicleList.length}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/alerts" className="hover:underline">
              <CardValue>{openAlertsList.length}</CardValue>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Veículos bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{blockedCount}</CardValue>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frota</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vehicleList.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Nenhum veículo cadastrado.{" "}
              <Link href="/vehicles/new" className="text-primary underline">
                Cadastre o primeiro
              </Link>
              .
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-6 py-2 font-medium">Apelido</th>
                  <th className="px-6 py-2 font-medium">Tipo</th>
                  <th className="px-6 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicleList.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-2">
                      <Link href={`/vehicles/${v.id}`} className="font-medium hover:underline">
                        {v.nickname}
                      </Link>
                    </td>
                    <td className="px-6 py-2 text-muted-foreground">{VEHICLE_TYPE_LABELS[v.type]}</td>
                    <td className="px-6 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <VehicleStatusBadge status={v.status} />
                        <VehicleAlertBadges alerts={alertsByVehicle.get(v.id) ?? []} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
