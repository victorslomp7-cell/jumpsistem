import { createClient } from "@/lib/supabase/server";
import { MaintenanceEventForm } from "@/components/maintenance/maintenance-event-form";
import type { Vehicle } from "@/types/domain";

export default async function NewMaintenancePage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("nickname");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Novo evento de manutenção</h1>
      <MaintenanceEventForm vehicles={(vehicles as Vehicle[] | null) ?? []} />
    </div>
  );
}
