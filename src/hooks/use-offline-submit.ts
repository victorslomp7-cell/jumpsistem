"use client";

import { useState } from "react";
import { enqueue } from "@/lib/offline/sync-manager";
import type { OutboxKind } from "@/lib/offline/db";

export interface OfflineSubmitResult {
  error?: string;
  success?: boolean;
  queued?: boolean;
}

/**
 * Submissão com fallback offline: tenta o POST direto; se não houver
 * conexão (ou o fetch falhar por erro de rede no meio do caminho), guarda
 * o lançamento na fila local (Dexie) pra reenviar sozinho depois — ver
 * src/lib/offline/sync-manager.ts. Um erro de validação vindo do servidor
 * (resposta HTTP recebida, só que não-2xx) NÃO entra na fila — reenviar o
 * mesmo dado inválido de novo não resolveria nada.
 */
export function useOfflineSubmit(kind: OutboxKind, endpoint: string) {
  const [state, setState] = useState<OfflineSubmitResult>({});
  const [isPending, setIsPending] = useState(false);

  async function submit(payload: Record<string, unknown>) {
    setIsPending(true);
    setState({});
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueue(kind, endpoint, payload);
        setState({ success: true, queued: true });
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setState({ success: true });
      } else {
        const body = await res.json().catch(() => ({}));
        setState({ error: body.error ?? `Erro ${res.status}` });
      }
    } catch {
      await enqueue(kind, endpoint, payload);
      setState({ success: true, queued: true });
    } finally {
      setIsPending(false);
    }
  }

  return { state, isPending, submit };
}
