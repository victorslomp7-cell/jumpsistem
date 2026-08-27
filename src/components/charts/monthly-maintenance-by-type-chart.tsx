"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyMaintenanceByType } from "@/lib/reports/aggregate";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function MonthlyMaintenanceByTypeChart({ data }: { data: MonthlyMaintenanceByType[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhum evento de manutenção ainda.
      </p>
    );
  }

  const chartData = data.map((d) => ({ ...d, monthLabel: formatMonth(d.month) }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <YAxis width={48} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
          <Legend />
          <Bar dataKey="jet_ski" name="Jet ski" stackId="tipo" fill="var(--color-chart-jetski)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="lancha" name="Lancha" stackId="tipo" fill="var(--color-chart-lancha)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="outro" name="Outro" stackId="tipo" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
