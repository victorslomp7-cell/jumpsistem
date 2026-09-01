"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ModelComparisonRow } from "@/lib/reports/compare-models";

const COLOR_BY_TYPE = {
  jet_ski: "var(--chart-jetski)",
  lancha: "var(--chart-lancha)",
  outro: "var(--muted-foreground)",
} as const;

export function ModelCostChart({ rows }: { rows: ModelComparisonRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhum dado de manutenção ainda.
      </p>
    );
  }

  const data = rows.map((r) => ({ model: r.model, cost: r.totalMaintenanceCost, type: r.vehicleType }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis width={48} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Manutenção"]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
            cursor={{ fill: "var(--foreground)", opacity: 0.06 }}
          />
          <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.model} fill={COLOR_BY_TYPE[d.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
