import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutCostChart } from "@/components/charts/donut-cost-chart";
import { MaintenanceChartCard } from "@/components/charts/maintenance-chart-card";
import {
  maintenanceProgressionByVehicleType,
  monthlyMaintenanceByVehicleType,
  totalCostByCategory,
  vehicleCostSummaries,
} from "@/lib/reports/aggregate";
import type { MaintenanceEvent, Refuel, Vehicle } from "@/types/domain";

export default async function ReportsPage() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: vehicles }, { data: refuels }, { data: events }] = await Promise.all([
    supabase.from("vehicles").select("*").order("nickname"),
    supabase.from("refuels").select("*"),
    supabase.from("maintenance_events").select("*"),
  ]);

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const refuelList = (refuels as Refuel[] | null) ?? [];
  const eventList = (events as MaintenanceEvent[] | null) ?? [];

  const vehicleTypeById = new Map(vehicleList.map((v) => [v.id, v.type]));
  const costs = totalCostByCategory(refuelList, eventList);
  const monthlyByType = monthlyMaintenanceByVehicleType(eventList, vehicleTypeById);
  const progressionByType = maintenanceProgressionByVehicleType(eventList, vehicleTypeById);
  const summaries = vehicleCostSummaries(
    vehicleList.map((v) => v.id),
    refuelList,
    eventList
  );

  const rankedVehicles = [...vehicleList].sort(
    (a, b) => (summaries.get(b.id)?.total ?? 0) - (summaries.get(a.id)?.total ?? 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Custos de toda a frota, desde o início.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Custo por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutCostChart costs={costs} />
          </CardContent>
        </Card>
        <MaintenanceChartCard monthly={monthlyByType} progression={progressionByType} />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Veículo</th>
              <th className="px-4 py-3 font-medium">Abastecimento</th>
              <th className="px-4 py-3 font-medium">Manutenção</th>
              <th className="px-4 py-3 font-medium">Total</th>
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
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">R$ {(s?.totalRefuels ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">R$ {(s?.totalMaintenance ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium">R$ {(s?.total ?? 0).toFixed(2)}</td>
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
