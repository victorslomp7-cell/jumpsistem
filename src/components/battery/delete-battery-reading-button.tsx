"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteBatteryReading } from "@/app/(dashboard)/vehicles/[id]/battery/actions";

export function DeleteBatteryReadingButton({
  readingId,
  vehicleId,
}: {
  readingId: string;
  vehicleId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm("Excluir esta leitura de bateria? Não dá pra desfazer.")) return;

    setError(null);
    setIsPending(true);
    const result = await deleteBatteryReading(readingId, vehicleId);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={isPending} onClick={handleClick}>
        {isPending ? "Excluindo…" : "Excluir"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
