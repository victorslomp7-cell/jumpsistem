import { VehicleTabs } from "@/components/vehicles/vehicle-tabs";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleRefuelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <VehicleTabs vehicleId={id} active="refuels" />
      <ComingSoon title="Abastecimento" phase="Fase 4 (Abastecimento)" />
    </div>
  );
}
