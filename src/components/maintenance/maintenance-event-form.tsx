"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAINTENANCE_EVENT_TYPE_LABELS } from "@/types/domain";
import type { MaintenanceEventType, Vehicle } from "@/types/domain";
import { createMaintenanceEvent } from "@/app/(dashboard)/maintenance/actions";

const inputClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function MaintenanceEventForm({ vehicleId, vehicles }: { vehicleId?: string; vehicles?: Vehicle[] }) {
  const [state, formAction, isPending] = useActionState(createMaintenanceEvent, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<MaintenanceEventType>("troca_peca");

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-xl flex-col gap-4">
      {vehicles ? (
        <label className="flex flex-col gap-1.5 text-sm">
          Veículo
          <select name="vehicle_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecione…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nickname}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="vehicle_id" value={vehicleId} />
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        Tipo
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as MaintenanceEventType)}
          className={inputClass}
        >
          {Object.entries(MAINTENANCE_EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Descrição
        <input name="description" required placeholder="Ex: troca de vela de ignição" className={inputClass} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Data
          <input name="event_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Horas do motor{type === "revisao" && <span className="text-destructive"> *</span>}
          <input
            name="hours_at_event"
            type="number"
            step="0.1"
            min="0"
            required={type === "revisao"}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Custo (R$)
          <input name="cost" type="number" step="0.01" min="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Orçamento (R$, opcional)
          <input name="budget" type="number" step="0.01" min="0" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Garantia até (opcional)
        <input name="warranty_until" type="date" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Anexar orçamento/nota fiscal (opcional)
        <input name="attachment" type="file" accept="image/*,.pdf" className="text-sm" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Observação
        <input name="notes" className={inputClass} />
      </label>

      {type === "revisao" && (
        <p className="text-xs text-muted-foreground">
          Marcar como revisão reinicia a contagem de horas até a próxima revisão (mesma lógica da aba Horas).
        </p>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">Evento registrado.</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Registrar evento"}
      </Button>
    </form>
  );
}
