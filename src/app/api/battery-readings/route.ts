import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ManualBatteryReadingAdapter } from "@/lib/battery/ingestion";

/**
 * Usada tanto pelo envio direto (online) quanto pela fila offline
 * (src/lib/offline/sync-manager.ts) — um único caminho de escrita, JSON
 * simples, sem depender de Server Action.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.vehicleId || typeof body.voltage !== "number") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const adapter = new ManualBatteryReadingAdapter(supabase);
  try {
    await adapter.ingest({
      vehicleId: body.vehicleId,
      voltage: body.voltage,
      readAt: body.readAt ?? new Date().toISOString(),
      recordedBy: user.id,
      notes: body.notes || undefined,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
