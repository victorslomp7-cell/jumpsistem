"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { archiveVehicle } from "@/app/(dashboard)/vehicles/actions";

export function ArchiveVehicleDialog({ vehicleId, nickname }: { vehicleId: string; nickname: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const action = archiveVehicle.bind(null, vehicleId);
  const [state, formAction, isPending] = useActionState(action, undefined);

  const matches = confirmation.trim() === nickname;

  return (
    <>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Remover veículo
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Remover {nickname}?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              O veículo sai da frota ativa, mas todo o histórico de manutenção, bateria e horas dele
              <strong> continua guardado</strong> — os relatórios de custo continuam contando o que já foi gasto.
              Você pode reativar o veículo depois, se precisar.
            </p>

            <form action={formAction} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                Pra confirmar, digite <strong>{nickname}</strong> abaixo:
                <input
                  name="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="off"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>

              {state?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={!matches || isPending}>
                  {isPending ? "Removendo…" : "Confirmar remoção"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
