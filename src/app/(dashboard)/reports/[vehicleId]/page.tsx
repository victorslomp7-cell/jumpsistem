import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleReportPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return <ComingSoon title={`Relatório — veículo ${vehicleId}`} phase="Fase 6 (Dashboards/Relatórios)" />;
}
