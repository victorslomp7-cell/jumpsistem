import { createClient } from "@/lib/supabase/server";
import { RefuelForm } from "@/components/refuels/refuel-form";
import type { Vehicle } from "@/types/domain";

export default async function NewRefuelPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("nickname");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Novo abastecimento</h1>
      <RefuelForm vehicles={(vehicles as Vehicle[] | null) ?? []} />
    </div>
  );
}
