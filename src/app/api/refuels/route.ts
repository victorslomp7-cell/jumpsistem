import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/types/domain";

/**
 * Versão JSON (sem anexo) do lançamento de abastecimento — usada pela fila
 * offline e pelo envio direto quando não há arquivo de NF. O formulário com
 * anexo continua passando pela Server Action
 * (src/app/(dashboard)/refuels/actions.ts), já que File não viaja bem em
 * JSON puro guardado no IndexedDB.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.vehicleId || typeof body.liters !== "number" || typeof body.totalValue !== "number") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { error } = await supabase.from("refuels").insert({
    vehicle_id: body.vehicleId,
    refuel_date: body.refuelDate || new Date().toISOString().slice(0, 10),
    engine_hours: typeof body.engineHours === "number" ? body.engineHours : null,
    fuel_type: body.fuelType || "Gasolina comum",
    liters: body.liters,
    price_per_liter: typeof body.pricePerLiter === "number" ? body.pricePerLiter : null,
    total_value: body.totalValue,
    gas_station: body.gasStation || null,
    full_tank: body.fullTank ?? true,
    payment_method: (body.paymentMethod || null) as PaymentMethod | null,
    driver_name: body.driverName || null,
    created_by: user.id,
    notes: body.notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
