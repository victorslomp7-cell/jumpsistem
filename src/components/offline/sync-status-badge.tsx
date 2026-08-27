"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getPendingCount, subscribeOutboxChanges, wireAutoSync } from "@/lib/offline/sync-manager";

export function SyncStatusBadge() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    wireAutoSync();
    const refresh = () => void getPendingCount().then(setPending);
    refresh();
    return subscribeOutboxChanges(refresh);
  }, []);

  if (online && pending === 0) return null;

  const label = online
    ? `${pending} pendente${pending === 1 ? "" : "s"} para enviar`
    : pending > 0
      ? `Offline · ${pending} pendente${pending === 1 ? "" : "s"}`
      : "Offline";

  return <Badge variant={online ? "warning" : "destructive"}>{label}</Badge>;
}
