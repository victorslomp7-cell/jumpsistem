import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.vehicleId || typeof body.hours !== "number") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { error } = await supabase.from("engine_hour_readings").insert({
    vehicle_id: body.vehicleId,
    hours: body.hours,
    recorded_by: user.id,
    notes: body.notes || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
