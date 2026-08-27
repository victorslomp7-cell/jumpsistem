"use client";

import { offlineDB, type OutboxItem, type OutboxKind } from "./db";

/**
 * Fila de mutações offline: os 3 formulários de campo (bateria, horas,
 * abastecimento) gravam aqui primeiro quando não há conexão (ou quando o
 * envio direto falha por erro de rede), e esta fila tenta reenviar sozinha
 * quando a conexão volta.
 *
 * Deliberadamente simples (sem Background Sync API — suporte fraco no
 * Safari/iOS, ver CLAUDE.md): sincroniza no evento `online`, num intervalo
 * periódico de segurança, e sempre que alguém chama `syncAll()` (ex.: ao
 * montar a página).
 */

const emitter = new EventTarget();
const CHANGE_EVENT = "outbox-change";

function notifyChange() {
  emitter.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeOutboxChanges(callback: () => void) {
  emitter.addEventListener(CHANGE_EVENT, callback);
  return () => emitter.removeEventListener(CHANGE_EVENT, callback);
}

export async function enqueue(kind: OutboxKind, endpoint: string, payload: Record<string, unknown>) {
  await offlineDB.outbox.add({
    kind,
    endpoint,
    payload,
    createdAt: Date.now(),
    status: "pending",
  });
  notifyChange();
  // Tenta sincronizar na hora — se estiver online mesmo assim, o item some
  // da fila quase instantaneamente em vez de esperar o próximo gatilho.
  void syncAll();
}

export async function getPendingCount(): Promise<number> {
  return offlineDB.outbox.count();
}

export async function getPendingItems(): Promise<OutboxItem[]> {
  return offlineDB.outbox.orderBy("createdAt").toArray();
}

let syncing = false;

export async function syncAll(): Promise<void> {
  if (syncing) return; // evita corridas concorrentes (evento online + intervalo)
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  syncing = true;
  try {
    const items = await offlineDB.outbox.orderBy("createdAt").toArray();

    for (const item of items) {
      try {
        const response = await fetch(item.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          await offlineDB.outbox.delete(item.id!);
        } else {
          const body = await response.json().catch(() => ({}));
          await offlineDB.outbox.update(item.id!, {
            status: "error",
            errorMessage: body.error ?? `Erro ${response.status}`,
          });
        }
      } catch {
        // Erro de rede no meio da tentativa — para por aqui, tenta de novo
        // no próximo gatilho (fica como "pending", não "error").
        break;
      }
    }
  } finally {
    syncing = false;
    notifyChange();
  }
}

let wired = false;

/** Chamar uma vez (ex.: no layout do dashboard) pra ligar os gatilhos automáticos. */
export function wireAutoSync() {
  if (wired || typeof window === "undefined") return;
  wired = true;

  window.addEventListener("online", () => void syncAll());
  window.addEventListener("focus", () => void syncAll());
  // Rede de segurança pra quando `online`/`focus` não disparam (comum em PWA no iOS).
  setInterval(() => void syncAll(), 60_000);

  void syncAll();
}
