import { Badge } from "@/components/ui/badge";
import { ALERT_TYPE_LABELS, type Alert } from "@/types/domain";

/**
 * Badges de alerta ligados diretamente ao veículo (revisão próxima/vencida).
 * Bateria baixa não aparece aqui pra não duplicar — já vira o status
 * "Bloqueado" (VehicleStatusBadge), que é mais visível.
 */
export function VehicleAlertBadges({ alerts }: { alerts: Alert[] }) {
  const revisionAlerts = alerts.filter(
    (a) => a.status === "open" && (a.type === "revision_due" || a.type === "revision_overdue")
  );

  if (revisionAlerts.length === 0) return null;

  return (
    <>
      {revisionAlerts.map((alert) => (
        <Badge key={alert.id} variant={alert.type === "revision_overdue" ? "destructive" : "warning"}>
          {ALERT_TYPE_LABELS[alert.type]}
        </Badge>
      ))}
    </>
  );
}
