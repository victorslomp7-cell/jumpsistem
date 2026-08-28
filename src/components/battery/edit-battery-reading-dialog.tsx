"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateBatteryReading } from "@/app/(dashboard)/vehicles/[id]/battery/actions";

export function EditBatteryReadingDialog({
  readingId,
  vehicleId,
  voltage,
  notes,
}: {
  readingId: string;
  vehicleId: string;
  voltage: number;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateBatteryReading(readingId, vehicleId, undefined, formData);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Editar leitura</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Só corrige o valor registrado — a data/hora da leitura não muda.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                Voltagem lida (V)
                <input
                  name="voltage"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={voltage}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Observação (opcional)
                <input
                  name="notes"
                  defaultValue={notes ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                />
              </label>

              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
