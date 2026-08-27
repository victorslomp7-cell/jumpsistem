"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CostByCategory } from "@/lib/reports/aggregate";

const COLORS = {
  refuels: "var(--color-jump-gold)",
  maintenance: "var(--color-jump-charcoal)",
};

export function DonutCostChart({ costs }: { costs: CostByCategory }) {
  const total = costs.refuels + costs.maintenance;

  if (total === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Nenhum custo lançado no período.
      </p>
    );
  }

  const data = [
    { name: "Abastecimento", value: costs.refuels, key: "refuels" as const },
    { name: "Manutenção", value: costs.maintenance, key: "maintenance" as const },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, ""]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
