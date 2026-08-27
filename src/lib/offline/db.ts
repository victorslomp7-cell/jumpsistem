import Dexie, { type EntityTable } from "dexie";

export type OutboxKind = "battery" | "hours" | "refuel";

export interface OutboxItem {
  id?: number;
  kind: OutboxKind;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "error";
  errorMessage?: string;
}

class JumpOfflineDB extends Dexie {
  outbox!: EntityTable<OutboxItem, "id">;

  constructor() {
    super("jump-frota-offline");
    this.version(1).stores({
      outbox: "++id, kind, status, createdAt",
    });
  }
}

// Uma instância só — Dexie já lida com múltiplas abas/conexões sozinho.
export const offlineDB = new JumpOfflineDB();
