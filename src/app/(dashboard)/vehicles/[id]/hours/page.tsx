import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleHoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="hours" />
      <ComingSoon title="Horas de motor" phase="Fase 3 (Horas/Revisão)" />
    </div>
  );
}
