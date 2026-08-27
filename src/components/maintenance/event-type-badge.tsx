import { BatteryCharging, CalendarCheck2, CircleEllipsis, Wrench } from "lucide-react";
import { MAINTENANCE_EVENT_TYPE_LABELS, type MaintenanceEventType } from "@/types/domain";
import { cn } from "@/lib/utils";

const CONFIG: Record<MaintenanceEventType, { icon: typeof Wrench; className: string }> = {
  revisao: { icon: CalendarCheck2, className: "bg-jump-gold/15 text-jump-gold-dark" },
  troca_peca: { icon: Wrench, className: "bg-amber-700/15 text-amber-800" },
  troca_bateria: { icon: BatteryCharging, className: "bg-blue-500/15 text-blue-700" },
  outro: { icon: CircleEllipsis, className: "bg-muted text-muted-foreground" },
};

export function EventTypeBadge({ type }: { type: MaintenanceEventType }) {
  const { icon: Icon, className } = CONFIG[type];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      <Icon className="size-3.5" />
      {MAINTENANCE_EVENT_TYPE_LABELS[type]}
    </span>
  );
}
