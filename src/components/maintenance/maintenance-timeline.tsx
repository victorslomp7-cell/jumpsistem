import Link from "next/link";
import { EventTypeBadge } from "@/components/maintenance/event-type-badge";
import type { MaintenanceEvent, Vehicle } from "@/types/domain";

export function MaintenanceTimeline({
  events,
  vehicleById,
  attachmentIdByEvent,
}: {
  events: MaintenanceEvent[];
  vehicleById?: Map<string, Vehicle>;
  attachmentIdByEvent: Map<string, string>;
}) {
  if (events.length === 0) {
    return <p className="px-6 py-6 text-sm text-muted-foreground">Nenhum evento de manutenção registrado ainda.</p>;
  }

  return (
    <ol className="flex flex-col gap-4 p-6">
      {events.map((event) => {
        const attachmentId = attachmentIdByEvent.get(event.id);
        const vehicle = vehicleById?.get(event.vehicle_id);
        return (
          <li key={event.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex flex-col items-center">
              <EventTypeBadge type={event.type} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{event.description}</p>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {vehicle && (
                  <Link href={`/vehicles/${vehicle.id}`} className="hover:underline">
                    {vehicle.nickname}
                  </Link>
                )}
                {event.hours_at_event !== null && <span>{event.hours_at_event}h no motor</span>}
                {event.cost !== null && <span>R$ {event.cost.toFixed(2)}</span>}
                {event.budget !== null && <span>orçamento R$ {event.budget.toFixed(2)}</span>}
                {event.warranty_until && (
                  <span>garantia até {new Date(event.warranty_until + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                )}
                {attachmentId && (
                  <a href={`/api/attachments/${attachmentId}`} target="_blank" rel="noreferrer" className="text-primary underline">
                    Ver anexo
                  </a>
                )}
              </div>
              {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
