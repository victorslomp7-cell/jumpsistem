"use client";

import { Button } from "@/components/ui/button";
import { deleteVehicle } from "@/app/(dashboard)/vehicles/actions";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  return (
    <form
      action={deleteVehicle.bind(null, vehicleId)}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que quer excluir este veículo? Essa ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  );
}
