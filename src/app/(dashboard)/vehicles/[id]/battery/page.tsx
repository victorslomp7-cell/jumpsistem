import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { BatteryTrendChart } from "@/components/battery/battery-trend-chart";
import { BatteryReadingForm } from "@/components/battery/battery-reading-form";
import { EditBatteryReadingDialog } from "@/components/battery/edit-battery-reading-dialog";
import { DeleteBatteryReadingButton } from "@/components/battery/delete-battery-reading-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatteryReading, Vehicle } from "@/types/domain";

export default async function VehicleBatteryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [current, { data: vehicle }, { data: readings }] = await Promise.all([
    getCurrentProfile(),
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("battery_readings")
      .select("*")
      .eq("vehicle_id", id)
      .order("read_at", { ascending: false })
      .limit(30),
  ]);

  if (!vehicle) notFound();

  const isAdmin = current?.profile?.role === "admin";

  const readingList = (readings as BatteryReading[] | null) ?? [];
  const latest = readingList[0];

  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="battery" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle className="text-base font-semibold text-foreground">Tendência de bateria</CardTitle>
              <VehicleStatusBadge status={(vehicle as Vehicle).status} />
            </CardHeader>
            <CardContent>
              <BatteryTrendChart readings={readingList} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de leituras</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {readingList.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma leitura ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-y border-border text-left text-muted-foreground">
                    <tr>
                      <th className="px-6 py-2 font-medium">Data</th>
                      <th className="px-6 py-2 font-medium">Voltagem</th>
                      <th className="px-6 py-2 font-medium">Observação</th>
                      {isAdmin && <th className="px-6 py-2 font-medium">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {readingList.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-2">
                          {new Date(r.read_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className={`px-6 py-2 font-medium ${r.voltage < 12 ? "text-destructive" : ""}`}>
                          {r.voltage}V
                        </td>
                        <td className="px-6 py-2 text-muted-foreground">{r.notes ?? "—"}</td>
                        {isAdmin && (
                          <td className="px-6 py-2">
                            <div className="flex items-center gap-1">
                              <EditBatteryReadingDialog
                                readingId={r.id}
                                vehicleId={id}
                                voltage={r.voltage}
                                notes={r.notes}
                              />
                              <DeleteBatteryReadingButton readingId={r.id} vehicleId={id} />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nova leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <BatteryReadingForm vehicleId={id} />
            {latest && (
              <p className="mt-4 text-xs text-muted-foreground">
                Última leitura: {latest.voltage}V em{" "}
                {new Date(latest.read_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
