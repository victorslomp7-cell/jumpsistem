import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MaintenanceTimeline } from "@/components/maintenance/maintenance-timeline";
import type { Attachment, MaintenanceEvent, Vehicle } from "@/types/domain";

export default async function MaintenancePage() {
  const supabase = await createClient();

  const [{ data: events }, { data: vehicles }] = await Promise.all([
    supabase.from("maintenance_events").select("*").order("event_date", { ascending: false }).limit(100),
    supabase.from("vehicles").select("*"),
  ]);

  const eventList = (events as MaintenanceEvent[] | null) ?? [];
  const vehicleById = new Map(((vehicles as Vehicle[] | null) ?? []).map((v) => [v.id, v]));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manutenção</h1>
          <p className="text-sm text-muted-foreground">
            R$ {totalCost.toFixed(2)} em custos registrados · {eventList.length} evento
            {eventList.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/maintenance/new" className={buttonVariants({})}>
          Novo evento
        </Link>
      </div>

      <Card className="p-0">
        <MaintenanceTimeline events={eventList} vehicleById={vehicleById} attachmentIdByEvent={attachmentIdByEvent} />
      </Card>
    </div>
  );
}
