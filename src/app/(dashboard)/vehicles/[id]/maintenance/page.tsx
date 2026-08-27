import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="maintenance" />
      <ComingSoon title="Manutenção" phase="Fase 5 (Manutenção/Histórico)" />
    </div>
  );
}
