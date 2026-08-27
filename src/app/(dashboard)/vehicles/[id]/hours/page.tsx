import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { HourReadingForm } from "@/components/hours/hour-reading-form";
import { RevisionProgress } from "@/components/hours/revision-progress";
import { CompleteRevisionForm } from "@/components/hours/complete-revision-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EngineHourReading, MaintenanceEvent, Vehicle } from "@/types/domain";

export default async function VehicleHoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: vehicle }, { data: readings }, { data: revisions }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
    supabase.from("engine_hour_readings").select("*").eq("vehicle_id", id).order("read_at", { ascending: false }).limit(30),
    supabase
      .from("maintenance_events")
      .select("*")
      .eq("vehicle_id", id)
      .eq("is_revision", true)
      .order("hours_at_event", { ascending: false })
      .limit(10),
  ]);

  if (!vehicle) notFound();

  const readingList = (readings as EngineHourReading[] | null) ?? [];
  const revisionList = (revisions as MaintenanceEvent[] | null) ?? [];
  const currentHours = readingList[0]?.hours ?? null;
  const hoursAtLastRevision = revisionList[0]?.hours_at_event ?? 0;
  const v = vehicle as Vehicle;

  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="hours" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Progresso até a próxima revisão</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <RevisionProgress
                currentHours={currentHours}
                hoursAtLastRevision={hoursAtLastRevision}
                revisionIntervalHours={v.revision_interval_hours}
                revisionWarningHours={v.revision_warning_hours}
              />
              <CompleteRevisionForm vehicleId={id} currentHours={currentHours} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de horas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {readingList.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma leitura ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-y border-border text-left text-muted-foreground">
                    <tr>
                      <th className="px-6 py-2 font-medium">Data</th>
                      <th className="px-6 py-2 font-medium">Horas</th>
                      <th className="px-6 py-2 font-medium">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingList.map((r) => (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-2">
                          {new Date(r.read_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-6 py-2 font-medium">{r.hours}h</td>
                        <td className="px-6 py-2 text-muted-foreground">{r.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {revisionList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisões registradas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="border-y border-border text-left text-muted-foreground">
                    <tr>
                      <th className="px-6 py-2 font-medium">Data</th>
                      <th className="px-6 py-2 font-medium">Horas</th>
                      <th className="px-6 py-2 font-medium">Descrição</th>
                      <th className="px-6 py-2 font-medium">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisionList.map((rev) => (
                      <tr key={rev.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-2">
                          {new Date(rev.event_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-2 font-medium">{rev.hours_at_event}h</td>
                        <td className="px-6 py-2 text-muted-foreground">{rev.description}</td>
                        <td className="px-6 py-2 text-muted-foreground">
                          {rev.cost ? `R$ ${rev.cost.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nova leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <HourReadingForm vehicleId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
