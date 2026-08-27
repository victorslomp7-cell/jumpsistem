"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addHourReading, type HoursActionState } from "@/app/(dashboard)/vehicles/[id]/hours/actions";

export function HourReadingForm({ vehicleId }: { vehicleId: string }) {
  const action = addHourReading.bind(null, vehicleId) as (
    state: HoursActionState | undefined,
    formData: FormData
  ) => Promise<HoursActionState>;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Horas totais do motor
        <input
          name="hours"
          type="number"
          step="0.1"
          min="0"
          required
          placeholder="Ex: 132.5"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Observação (opcional)
        <input
          name="notes"
          placeholder="Ex: leitura mensal"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">Leitura registrada.</p>
      )}

      <p className="text-xs text-muted-foreground">
        Informe o total acumulado no horímetro, não as horas rodadas desde a última leitura.
      </p>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Lançar leitura"}
      </Button>
    </form>
  );
}
