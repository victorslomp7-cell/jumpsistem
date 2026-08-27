import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALERT_TYPE_LABELS, type AlertType } from "@/types/domain";

/**
 * Recebida por um Database Webhook do Supabase (Database → Webhooks),
 * configurado na tabela `alerts`, evento INSERT, apontando pra
 * https://<seu-dominio>/api/push/notify — não é uma Edge Function, é só
 * mais uma rota deste próprio app (mais simples: sem precisar de deploy
 * separado via CLI). Protegida por um segredo compartilhado no header
 * "x-webhook-secret" (ver PUSH_WEBHOOK_SECRET no .env).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const record = body?.record;
  if (!record || body?.table !== "alerts" || body?.type !== "INSERT") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    console.error("Web Push não configurado — faltam as chaves VAPID no ambiente.");
    return NextResponse.json({ error: "Web Push não configurado no servidor." }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const admin = createAdminClient();

  let vehicleLabel = "";
  if (record.vehicle_id) {
    const { data: vehicle } = await admin.from("vehicles").select("*").eq("id", record.vehicle_id).maybeSingle();
    if (vehicle) vehicleLabel = ` — ${vehicle.nickname}`;
  }

  const { data: subscriptions } = await admin.from("push_subscriptions").select("*");
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const title = `${ALERT_TYPE_LABELS[record.type as AlertType] ?? "Alerta"}${vehicleLabel}`;
  const payload = JSON.stringify({
    title,
    body: record.message ?? "",
    url: record.vehicle_id ? `/vehicles/${record.vehicle_id}` : "/alerts",
  });

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Inscrição expirada/revogada — limpa pra não tentar de novo.
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Falha ao enviar push:", err);
        }
      }
    })
  );

  return NextResponse.json({ ok: true, sent });
}
