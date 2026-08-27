import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertRowActions } from "@/components/alerts/alert-row-actions";
import { ALERT_STATUS_LABELS, ALERT_TYPE_LABELS, type Alert, type Vehicle } from "@/types/domain";

const SEVERITY_VARIANT = {
  info: "default",
  warning: "warning",
  critical: "destructive",
} as const;

export default async function AlertsPage() {
  const supabase = await createClient();

  const [{ data: alerts }, { data: vehicles }] = await Promise.all([
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("vehicles").select("*"),
  ]);

  const vehicleById = new Map(((vehicles as Vehicle[] | null) ?? []).map((v) => [v.id, v]));
  const alertList = (alerts as Alert[] | null) ?? [];
  const openCount = alertList.filter((a) => a.status === "open").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Central de alertas</h1>
        <p className="text-sm text-muted-foreground">
          {openCount} alerta{openCount === 1 ? "" : "s"} aberto{openCount === 1 ? "" : "s"}
        </p>
      </div>

      {alertList.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum alerta registrado.</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Veículo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Mensagem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {alertList.map((alert) => {
                const vehicle = alert.vehicle_id ? vehicleById.get(alert.vehicle_id) : undefined;
                return (
                  <tr key={alert.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {vehicle ? (
                        <Link href={`/vehicles/${vehicle.id}`} className="hover:underline">
                          {vehicle.nickname}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SEVERITY_VARIANT[alert.severity]}>{ALERT_TYPE_LABELS[alert.type]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{alert.message}</td>
                    <td className="px-4 py-3">{ALERT_STATUS_LABELS[alert.status]}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <AlertRowActions alertId={alert.id} status={alert.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
