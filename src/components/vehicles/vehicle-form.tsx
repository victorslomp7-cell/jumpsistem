"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  REVISION_DEFAULTS,
  VEHICLE_TYPE_LABELS,
  type Vehicle,
  type VehicleType,
} from "@/types/domain";
import type { VehicleActionState } from "@/app/(dashboard)/vehicles/actions";

type Action = (
  state: VehicleActionState | undefined,
  formData: FormData
) => Promise<VehicleActionState>;

export function VehicleForm({ vehicle, action }: { vehicle?: Vehicle; action: Action }) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [type, setType] = useState<VehicleType>(vehicle?.type ?? "jet_ski");

  const defaults = REVISION_DEFAULTS[type];

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <Field label="Apelido / identificação" required>
        <input
          name="nickname"
          required
          defaultValue={vehicle?.nickname}
          placeholder="Ex: GTI 001"
          className={inputClass}
        />
      </Field>

      <Field label="Tipo" required>
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as VehicleType)}
          className={inputClass}
        >
          {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Modelo">
        <input
          name="model"
          defaultValue={vehicle?.model ?? ""}
          placeholder="Ex: Sea-Doo GTI 170"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Placa/registro">
          <input name="plate" defaultValue={vehicle?.plate ?? ""} className={inputClass} />
        </Field>
        <Field label="Ano">
          <input
            name="year"
            type="number"
            defaultValue={vehicle?.year ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="mb-3 text-sm font-medium">Regra de revisão por horas</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Intervalo de revisão (horas)">
            <input
              name="revision_interval_hours"
              type="number"
              step="0.1"
              defaultValue={vehicle?.revision_interval_hours ?? defaults.intervalHours ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Avisar com quantas horas de antecedência">
            <input
              name="revision_warning_hours"
              type="number"
              step="0.1"
              defaultValue={vehicle?.revision_warning_hours ?? defaults.warningHours ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Defaults sugeridos por tipo (jet ski: 50h / aviso 10h; lancha: 100h / aviso 20h) —
          sempre editáveis por veículo.
        </p>
      </div>

      {type === "jet_ski" && (
        <Field label="Frequência de leitura de bateria (dias)">
          <input
            name="battery_check_frequency_days"
            type="number"
            defaultValue={vehicle?.battery_check_frequency_days ?? 1}
            className={inputClass}
          />
        </Field>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando…" : vehicle ? "Salvar alterações" : "Cadastrar veículo"}
      </Button>
    </form>
  );
}

const inputClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
