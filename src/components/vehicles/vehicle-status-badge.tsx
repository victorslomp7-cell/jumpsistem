import { Badge } from "@/components/ui/badge";
import { VEHICLE_STATUS_LABELS, type VehicleStatus } from "@/types/domain";

const VARIANT: Record<VehicleStatus, "success" | "destructive" | "warning"> = {
  disponivel: "success",
  bloqueado: "destructive",
  manutencao: "warning",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge variant={VARIANT[status]}>{VEHICLE_STATUS_LABELS[status]}</Badge>;
}
