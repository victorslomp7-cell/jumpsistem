"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOfflineSubmit } from "@/hooks/use-offline-submit";

export function HourReadingForm({ vehicleId }: { vehicleId: string }) {
  const { state, isPending, submit } = useOfflineSubmit("hours", "/api/engine-hour-readings");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hours = Number(formData.get("hours"));
    if (!hours && hours !== 0) return;

    await submit({
      vehicleId,
      hours,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          {state.queued ? "Sem conexão — leitura salva localmente, será enviada quando a internet voltar." : "Leitura registrada."}
        </p>
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
