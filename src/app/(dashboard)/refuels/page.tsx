import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefuelList } from "@/components/refuels/refuel-list";
import type { Attachment, Refuel, Vehicle } from "@/types/domain";

export default async function RefuelsPage() {
  const supabase = await createClient();

  const [{ data: refuels }, { data: vehicles }] = await Promise.all([
    supabase.from("refuels").select("*").order("refuel_date", { ascending: false }).limit(100),
    supabase.from("vehicles").select("*"),
  ]);

  const refuelList = (refuels as Refuel[] | null) ?? [];
  const vehicleById = new Map(((vehicles as Vehicle[] | null) ?? []).map((v) => [v.id, v]));

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const total30d = refuelList
    .filter((r) => new Date(r.refuel_date) >= thirtyDaysAgo)
    .reduce((sum, r) => sum + r.total_value, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Abastecimento</h1>
          <p className="text-sm text-muted-foreground">
            R$ {total30d.toFixed(2)} nos últimos 30 dias · {refuelList.length} lançamento
            {refuelList.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/refuels/new" className={buttonVariants({})}>
          Novo abastecimento
        </Link>
      </div>

      <Card className="overflow-x-auto p-0">
        <RefuelList refuels={refuelList} vehicleById={vehicleById} attachmentIdByRefuel={attachmentIdByRefuel} />
      </Card>
    </div>
  );
}
