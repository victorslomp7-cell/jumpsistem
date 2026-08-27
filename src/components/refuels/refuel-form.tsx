"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/types/domain";
import type { Vehicle } from "@/types/domain";
import { createRefuel, type RefuelActionState } from "@/app/(dashboard)/refuels/actions";
import { enqueue } from "@/lib/offline/sync-manager";

const inputClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

function buildOfflinePayload(formData: FormData) {
  const num = (key: string) => {
    const v = formData.get(key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    vehicleId: String(formData.get("vehicle_id") ?? ""),
    refuelDate: String(formData.get("refuel_date") ?? ""),
    engineHours: num("engine_hours"),
    fuelType: String(formData.get("fuel_type") ?? ""),
    liters: num("liters"),
    pricePerLiter: num("price_per_liter"),
    totalValue: num("total_value"),
    gasStation: String(formData.get("gas_station") ?? ""),
    fullTank: formData.get("full_tank") === "on",
    paymentMethod: String(formData.get("payment_method") ?? "") || undefined,
    driverName: String(formData.get("driver_name") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export function RefuelForm({ vehicleId, vehicles }: { vehicleId?: string; vehicles?: Vehicle[] }) {
  const [state, setState] = useState<RefuelActionState & { queued?: boolean }>({});
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const litersRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const recalcTotal = () => {
    const liters = Number(litersRef.current?.value);
    const price = Number(priceRef.current?.value);
    if (liters > 0 && price > 0 && totalRef.current) {
      totalRef.current.value = (liters * price).toFixed(2);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("attachment");
    const hasFile = file instanceof File && file.size > 0;

    setIsPending(true);
    setState({});

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (hasFile) {
        setState({ error: "Sem conexão — anexos não podem ser enviados offline. Remova o anexo ou tente de novo com internet." });
        setIsPending(false);
        return;
      }
      await enqueue("refuel", "/api/refuels", buildOfflinePayload(formData));
      setState({ success: true, queued: true });
      formRef.current?.reset();
      setIsPending(false);
      return;
    }

    try {
      const result = await createRefuel(undefined, formData);
      setState(result);
      if (result.success) {
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      if (hasFile) {
        setState({ error: "Falha de conexão ao enviar o anexo — tente novamente." });
      } else {
        await enqueue("refuel", "/api/refuels", buildOfflinePayload(formData));
        setState({ success: true, queued: true });
        formRef.current?.reset();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
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

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Data
          <input
            name="refuel_date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Horas do motor (opcional)
          <input name="engine_hours" type="number" step="0.1" min="0" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Combustível
        <input name="fuel_type" list="fuel-types" defaultValue="Gasolina comum" className={inputClass} />
        <datalist id="fuel-types">
          <option value="Gasolina comum" />
          <option value="Gasolina aditivada" />
          <option value="Etanol" />
        </datalist>
      </label>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Litros
          <input
            ref={litersRef}
            name="liters"
            type="number"
            step="0.01"
            min="0"
            required
            onChange={recalcTotal}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Preço/litro
          <input
            ref={priceRef}
            name="price_per_liter"
            type="number"
            step="0.001"
            min="0"
            onChange={recalcTotal}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Valor total
          <input ref={totalRef} name="total_value" type="number" step="0.01" min="0" required className={inputClass} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input name="full_tank" type="checkbox" defaultChecked className="size-4" />
        Completou o tanque?
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Posto de combustível
          <input name="gas_station" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Motorista
          <input name="driver_name" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Forma de pagamento
        <select name="payment_method" defaultValue="" className={inputClass}>
          <option value="">—</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Anexar nota fiscal (opcional — exige conexão)
        <input name="attachment" type="file" accept="image/*,.pdf" className="text-sm" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Observação
        <input name="notes" className={inputClass} />
      </label>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          {state.queued
            ? "Sem conexão — abastecimento salvo localmente, será enviado quando a internet voltar."
            : "Abastecimento registrado."}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Lançar abastecimento"}
      </Button>
    </form>
  );
}
