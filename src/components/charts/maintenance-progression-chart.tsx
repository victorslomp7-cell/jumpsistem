"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MaintenanceProgressionPoint } from "@/lib/reports/aggregate";

export function MaintenanceProgressionChart({ data }: { data: MaintenanceProgressionPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhum evento de manutenção ainda.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <YAxis width={48} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
          <Legend />
          <Line
            type="stepAfter"
            dataKey="jet_ski"
            name="Jet ski"
            stroke="var(--color-jump-gold)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="stepAfter"
            dataKey="lancha"
            name="Lancha"
            stroke="var(--color-jump-navy)"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Line
            type="stepAfter"
            dataKey="outro"
            name="Outro"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
