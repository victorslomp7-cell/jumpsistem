"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/types/domain";
import type { Vehicle } from "@/types/domain";
import { createRefuel } from "@/app/(dashboard)/refuels/actions";

const inputClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function RefuelForm({ vehicleId, vehicles }: { vehicleId?: string; vehicles?: Vehicle[] }) {
  const [state, formAction, isPending] = useActionState(createRefuel, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const litersRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  // Preenchimento automático do valor total (o usuário ainda pode sobrescrever depois).
  const recalcTotal = () => {
    const liters = Number(litersRef.current?.value);
    const price = Number(priceRef.current?.value);
    if (liters > 0 && price > 0 && totalRef.current) {
      totalRef.current.value = (liters * price).toFixed(2);
    }
  };

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
        Anexar nota fiscal (opcional)
        <input name="attachment" type="file" accept="image/*,.pdf" className="text-sm" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Observação
        <input name="notes" className={inputClass} />
      </label>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">Abastecimento registrado.</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : "Lançar abastecimento"}
      </Button>
    </form>
  );
}
