"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BATTERY_MIN_VOLTAGE } from "@/lib/battery/ingestion";
import { addBatteryReading, type BatteryActionState } from "@/app/(dashboard)/vehicles/[id]/battery/actions";

export function BatteryReadingForm({ vehicleId }: { vehicleId: string }) {
  const action = addBatteryReading.bind(null, vehicleId) as (
    state: BatteryActionState | undefined,
    formData: FormData
  ) => Promise<BatteryActionState>;
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Voltagem lida (V)
        <input
          name="voltage"
          type="number"
          step="0.1"
          required
          placeholder="Ex: 12.6"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Observação (opcional)
        <input
          name="notes"
          placeholder="Ex: bateria trocada ontem"
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
        Abaixo de {BATTERY_MIN_VOLTAGE}V o veículo é bloqueado automaticamente até a próxima leitura ≥{" "}
        {BATTERY_MIN_VOLTAGE}V.
      </p>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Lançar leitura"}
      </Button>
    </form>
  );
}
