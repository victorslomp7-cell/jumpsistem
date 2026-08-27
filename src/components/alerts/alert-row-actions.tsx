"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setAlertStatus } from "@/app/(dashboard)/alerts/actions";
import type { AlertStatus } from "@/types/domain";

export function AlertRowActions({ alertId, status }: { alertId: string; status: AlertStatus }) {
  const [isPending, startTransition] = useTransition();

  if (status === "resolved") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-2">
      {status === "open" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => setAlertStatus(alertId, "acknowledged"))}
        >
          Reconhecer
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => setAlertStatus(alertId, "resolved"))}
      >
        Resolver
      </Button>
    </div>
  );
}
