"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { reactivateVehicle } from "@/app/(dashboard)/vehicles/actions";

export function ReactivateVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => reactivateVehicle(vehicleId))}
    >
      {isPending ? "Reativando…" : "Reativar veículo"}
    </Button>
  );
}
