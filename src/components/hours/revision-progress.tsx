import { Badge } from "@/components/ui/badge";
import { evaluateRevision, type RevisionStatus } from "@/lib/hours/revision";

const STATUS_VARIANT: Record<RevisionStatus, "success" | "warning" | "destructive"> = {
  ok: "success",
  aviso: "warning",
  vencida: "destructive",
};

const STATUS_LABEL: Record<RevisionStatus, string> = {
  ok: "Em dia",
  aviso: "Revisão próxima",
  vencida: "Revisão vencida",
};

export function RevisionProgress({
  currentHours,
  hoursAtLastRevision,
  revisionIntervalHours,
  revisionWarningHours,
}: {
  currentHours: number | null;
  hoursAtLastRevision: number;
  revisionIntervalHours: number | null;
  revisionWarningHours: number | null;
}) {
  if (revisionIntervalHours === null) {
    return <p className="text-sm text-muted-foreground">Este veículo não tem regra de revisão configurada.</p>;
  }

  if (currentHours === null) {
    return <p className="text-sm text-muted-foreground">Lance a primeira leitura de horas para ver o progresso.</p>;
  }

  const { hoursSinceLastRevision, hoursUntilNextRevision, status } = evaluateRevision({
    currentHours,
    hoursAtLastRevision,
    revisionIntervalHours,
    revisionWarningHours: revisionWarningHours ?? 0,
  });

  const percent = Math.min(100, Math.max(0, (hoursSinceLastRevision / revisionIntervalHours) * 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {hoursSinceLastRevision.toFixed(1)}h desde a última revisão de {revisionIntervalHours}h
        </span>
        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            status === "vencida" ? "h-full bg-destructive" : status === "aviso" ? "h-full bg-warning" : "h-full bg-success"
          }
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {hoursUntilNextRevision > 0
          ? `Faltam ${hoursUntilNextRevision.toFixed(1)}h para a próxima revisão.`
          : `${Math.abs(hoursUntilNextRevision).toFixed(1)}h além do limite.`}
      </p>
    </div>
  );
}
