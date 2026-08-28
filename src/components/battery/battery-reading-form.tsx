"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { BATTERY_MIN_VOLTAGE } from "@/lib/battery/ingestion";
import { useOfflineSubmit } from "@/hooks/use-offline-submit";
import { useRouter } from "next/navigation";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BatteryReadingForm({ vehicleId }: { vehicleId: string }) {
  const { state, isPending, submit } = useOfflineSubmit("battery", "/api/battery-readings");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  // Calculado uma vez, na montagem — só pro limite (não deixar escolher
  // data futura), não é o valor do campo (esse fica vazio por padrão).
  const [maxDatetime] = useState(() => toDatetimeLocalValue(new Date()));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const voltage = Number(formData.get("voltage"));
    if (!voltage) return;

    // datetime-local não carrega fuso — new Date(...) interpreta como
    // horário local do navegador de quem está lançando, que é o
    // comportamento certo (é ele que está no veículo, naquele momento).
    const readAtRaw = String(formData.get("read_at") ?? "").trim();
    const readAt = readAtRaw ? new Date(readAtRaw).toISOString() : undefined;

    await submit({
      vehicleId,
      voltage,
      readAt,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Voltagem lida (V)
        <input
          name="voltage"
          type="number"
          step="0.01"
          required
          placeholder="Ex: 12.43"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Data e hora da leitura (opcional)
        <input
          name="read_at"
          type="datetime-local"
          max={maxDatetime}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
        <span className="text-xs text-muted-foreground">
          Deixe em branco pra lançar como agora. Pra registrar um dia atrasado, escolha aqui a data/hora certa.
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Observação (opcional)
        <input
          name="notes"
          placeholder="Ex: bateria trocada ontem"
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
        Abaixo de {BATTERY_MIN_VOLTAGE}V o veículo é bloqueado automaticamente até a próxima leitura ≥{" "}
        {BATTERY_MIN_VOLTAGE}V. Uma leitura retroativa só atualiza o bloqueio se for mais recente que a última
        já lançada — datas passadas só entram no histórico.
      </p>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Lançar leitura"}
      </Button>
    </form>
  );
}
