import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { MaintenanceEventForm } from "@/components/maintenance/maintenance-event-form";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attachment, MaintenanceEvent } from "@/types/domain";

export default async function VehicleMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: vehicle }, { data: events }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("maintenance_events")
      .select("*")
      .eq("vehicle_id", id)
      .order("event_date", { ascending: false })
      .limit(50),
  ]);

  if (!vehicle) notFound();

  const eventList = (events as MaintenanceEvent[] | null) ?? [];
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

  const totalCost = eventList.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="maintenance" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico — total R$ {totalCost.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MaintenanceTimeline events={eventList} attachmentIdByEvent={attachmentIdByEvent} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Novo evento</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceEventForm vehicleId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
