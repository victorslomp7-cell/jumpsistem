"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeRevision, type HoursActionState } from "@/app/(dashboard)/vehicles/[id]/hours/actions";

export function CompleteRevisionForm({ vehicleId, currentHours }: { vehicleId: string; currentHours: number | null }) {
  const action = completeRevision.bind(null, vehicleId) as (
    state: HoursActionState | undefined,
    formData: FormData
  ) => Promise<HoursActionState>;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-fit">
        Registrar revisão concluída
      </Button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Registrar revisão concluída</p>
      <label className="flex flex-col gap-1.5 text-sm">
        Horas do motor no momento da revisão
        <input
          name="hours_at_event"
          type="number"
          step="0.1"
          min="0"
          required
          defaultValue={currentHours ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Descrição
        <input
          name="description"
          defaultValue="Revisão periódica"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Custo (R$, opcional)
        <input
          name="cost"
          type="number"
          step="0.01"
          min="0"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
      </label>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Revisão registrada — contagem reiniciada.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Isso reseta a contagem de horas até a próxima revisão a partir de agora. Anexo de nota fiscal e histórico
        completo chegam na Fase 5.
      </p>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Confirmar revisão"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
