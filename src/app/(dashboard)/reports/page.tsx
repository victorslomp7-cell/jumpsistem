import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MaintenanceChartCard } from "@/components/charts/maintenance-chart-card";
import {
  maintenanceProgressionByVehicleType,
  monthlyMaintenanceByVehicleType,
  vehicleCostSummaries,
} from "@/lib/reports/aggregate";
import type { MaintenanceEvent, Vehicle } from "@/types/domain";

export default async function ReportsPage() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  // Inclui veículos arquivados (removidos) também — o custo já gasto neles
  // continua valendo pro relatório financeiro, mesmo fora da frota ativa.
  const [{ data: vehicles }, { data: events }] = await Promise.all([
    supabase.from("vehicles").select("*").order("nickname"),
    supabase.from("maintenance_events").select("*"),
  ]);

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const eventList = (events as MaintenanceEvent[] | null) ?? [];

  const vehicleTypeById = new Map(vehicleList.map((v) => [v.id, v.type]));
  const monthlyByType = monthlyMaintenanceByVehicleType(eventList, vehicleTypeById);
  const progressionByType = maintenanceProgressionByVehicleType(eventList, vehicleTypeById);
  const summaries = vehicleCostSummaries(
    vehicleList.map((v) => v.id),
    eventList
  );

  const rankedVehicles = [...vehicleList].sort(
    (a, b) => (summaries.get(b.id)?.totalMaintenance ?? 0) - (summaries.get(a.id)?.totalMaintenance ?? 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Custo de manutenção de toda a frota, desde o início.</p>
        </div>
        <Link href="/reports/comparativo" className={buttonVariants({ variant: "outline" })}>
          Comparativo por modelo
        </Link>
      </div>

      <MaintenanceChartCard monthly={monthlyByType} progression={progressionByType} />

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Manutenção</th>
              <th className="px-4 py-3 font-medium">Revisões</th>
            </tr>
          </thead>
          <tbody>
            {rankedVehicles.map((v) => {
              const s = summaries.get(v.id);
              return (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/reports/${v.id}`} className="font-medium hover:underline">
                      {v.nickname}
                    </Link>
                    {v.deleted_at && (
                      <Badge variant="default" className="ml-2">
                        Removido
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">R$ {(s?.totalMaintenance ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s?.revisionCount ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
