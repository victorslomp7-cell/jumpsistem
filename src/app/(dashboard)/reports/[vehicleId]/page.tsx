import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { MonthlyCostChart } from "@/components/charts/monthly-cost-chart";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import { monthlyCosts } from "@/lib/reports/aggregate";
import { VEHICLE_TYPE_LABELS } from "@/types/domain";
import type { Attachment, MaintenanceEvent, Refuel, Vehicle } from "@/types/domain";

export default async function VehicleReportPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [{ data: vehicle }, { data: refuels }, { data: events }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", vehicleId).maybeSingle(),
    supabase.from("refuels").select("*").eq("vehicle_id", vehicleId),
    supabase
      .from("maintenance_events")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("event_date", { ascending: false }),
  ]);

  if (!vehicle) notFound();
  const v = vehicle as Vehicle;

  const refuelList = (refuels as Refuel[] | null) ?? [];
  const eventList = (events as MaintenanceEvent[] | null) ?? [];

  const totalRefuels = refuelList.reduce((sum, r) => sum + r.total_value, 0);
  const totalMaintenance = eventList.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const revisionCount = eventList.filter((e) => e.is_revision).length;

  const chartData = monthlyCosts(refuelList, eventList);

  const eventIds = eventList.map((e) => e.id);
  let attachmentIdByEvent = new Map<string, string>();
  if (eventIds.length > 0) {
    const { data: attachments } = await supabase
      .from("attachments")
      .select("*")
      .eq("owner_type", "maintenance_event")
      .in("owner_id", eventIds);
    attachmentIdByEvent = new Map(((attachments as Attachment[] | null) ?? []).map((a) => [a.owner_id, a.id]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatório — {v.nickname}</h1>
        <p className="text-sm text-muted-foreground">{VEHICLE_TYPE_LABELS[v.type]}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Abastecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>R$ {totalRefuels.toFixed(2)}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>R$ {totalMaintenance.toFixed(2)}</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revisões registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>{revisionCount}</CardValue>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custo por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyCostChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader className="p-6 pb-0">
          <CardTitle>Histórico de manutenção</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MaintenanceTimeline events={eventList} attachmentIdByEvent={attachmentIdByEvent} />
        </CardContent>
      </Card>
    </div>
  );
}
