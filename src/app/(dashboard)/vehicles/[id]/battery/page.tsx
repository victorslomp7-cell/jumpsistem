import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleBatteryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="battery" />
      <ComingSoon title="Bateria" phase="Fase 2 (Bateria)" />
    </div>
  );
}
