import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ModelCostChart } from "@/components/charts/model-cost-chart";
import { compareVehiclesByModel } from "@/lib/reports/compare-models";
import { VEHICLE_TYPE_LABELS, type Vehicle } from "@/types/domain";

export default async function CompareModelsPage() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  // Inclui veículos arquivados também: a comparação é sobre o desempenho
  // histórico de cada modelo, não só a frota ativa hoje — inclusive um
  // modelo problemático que já foi removido é exatamente o tipo de sinal
  // que essa tela deve mostrar.
  const [{ data: vehicles }, { data: hourReadings }, { data: batteryReadings }, { data: events }] =
    await Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("engine_hour_readings").select("*"),
      supabase.from("battery_readings").select("*"),
      supabase.from("maintenance_events").select("*"),
    ]);

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const rows = compareVehiclesByModel(
    vehicleList,
    hourReadings ?? [],
    batteryReadings ?? [],
    events ?? []
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comparativo por modelo</h1>
          <p className="text-sm text-muted-foreground">
            Jet skis e lanchas comparados por modelo — inclui veículos já removidos da frota.
          </p>
        </div>
        <a
          href="/api/reports/comparativo/export"
          className={buttonVariants({ variant: "outline" })}
        >
          Exportar Excel
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custo total de manutenção por modelo</CardTitle>
        </CardHeader>
        <CardContent>
          <ModelCostChart rows={rows} />
        </CardContent>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Modelo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Qtd.</th>
              <th className="px-4 py-3 font-medium">Horas médias</th>
              <th className="px-4 py-3 font-medium">Custo manutenção</th>
              <th className="px-4 py-3 font-medium">Custo/hora</th>
              <th className="px-4 py-3 font-medium">% bateria baixa</th>
              <th className="px-4 py-3 font-medium">Dias entre revisões</th>
              <th className="px-4 py-3 font-medium">Revisões</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{row.model}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.vehicleType === "jet_ski" ? "primary" : "default"}>
                    {VEHICLE_TYPE_LABELS[row.vehicleType]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.vehicleCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.avgHours !== null ? `${row.avgHours.toFixed(1)}h` : "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  R$ {row.totalMaintenanceCost.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (R$ {row.avgMaintenanceCostPerVehicle.toFixed(2)}/veículo)
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.costPerHour !== null ? `R$ ${row.costPerHour.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.batteryLowRatePercent !== null ? `${row.batteryLowRatePercent.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.avgDaysBetweenRevisions !== null ? `${row.avgDaysBetweenRevisions.toFixed(0)} dias` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.revisionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link href="/reports" className="underline">
          ← Voltar pra Relatórios
        </Link>
      </p>
    </div>
  );
}
