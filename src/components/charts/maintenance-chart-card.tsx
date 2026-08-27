"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthlyMaintenanceByTypeChart } from "@/components/charts/monthly-maintenance-by-type-chart";
import { MaintenanceProgressionChart } from "@/components/charts/maintenance-progression-chart";
import type { MaintenanceProgressionPoint, MonthlyMaintenanceByType } from "@/lib/reports/aggregate";

type View = "month" | "progression";

export function MaintenanceChartCard({
  monthly,
  progression,
}: {
  monthly: MonthlyMaintenanceByType[];
  progression: MaintenanceProgressionPoint[];
}) {
  const [view, setView] = useState<View>("month");

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Manutenção por tipo de veículo</CardTitle>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={view === "month" ? "primary" : "ghost"}
            className="h-7 px-3 text-xs"
            onClick={() => setView("month")}
          >
            Por mês
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "progression" ? "primary" : "ghost"}
            className="h-7 px-3 text-xs"
            onClick={() => setView("progression")}
          >
            Progressão
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "month" ? <MonthlyMaintenanceByTypeChart data={monthly} /> : <MaintenanceProgressionChart data={progression} />}
      </CardContent>
    </Card>
  );
}
