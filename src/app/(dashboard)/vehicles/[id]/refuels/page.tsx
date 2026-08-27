import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { RefuelForm } from "@/components/refuels/refuel-form";
import { RefuelList } from "@/components/refuels/refuel-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attachment, Refuel } from "@/types/domain";

export default async function VehicleRefuelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: vehicle }, { data: refuels }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).maybeSingle(),
    supabase.from("refuels").select("*").eq("vehicle_id", id).order("refuel_date", { ascending: false }).limit(50),
  ]);

  if (!vehicle) notFound();

  const refuelList = (refuels as Refuel[] | null) ?? [];
  const refuelIds = refuelList.map((r) => r.id);
  let attachmentIdByRefuel = new Map<string, string>();
  if (refuelIds.length > 0) {
    const { data: attachments } = await supabase
      .from("attachments")
      .select("*")
      .eq("owner_type", "refuel")
      .in("owner_id", refuelIds);
    attachmentIdByRefuel = new Map(
      ((attachments as Attachment[] | null) ?? []).map((a) => [a.owner_id, a.id])
    );
  }

  const total = refuelList.reduce((sum, r) => sum + r.total_value, 0);

  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="refuels" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de abastecimento — total R$ {total.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <RefuelList refuels={refuelList} attachmentIdByRefuel={attachmentIdByRefuel} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Novo abastecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <RefuelForm vehicleId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
