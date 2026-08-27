import { ComingSoon } from "@/components/layout/coming-soon";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComingSoon title={`Veículo ${id}`} phase="Fases 1–5 (abas Geral/Bateria/Horas/Abastecimento/Manutenção)" />;
}
