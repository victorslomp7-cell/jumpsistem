"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BATTERY_MIN_VOLTAGE } from "@/lib/battery/ingestion";
import type { BatteryReading } from "@/types/domain";

export function BatteryTrendChart({ readings }: { readings: BatteryReading[] }) {
  if (readings.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Nenhuma leitura registrada ainda.
      </p>
    );
  }

  const data = [...readings]
    .sort((a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime())
    .map((r) => ({
      date: new Date(r.read_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      voltage: r.voltage,
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(value) => [`${value}V`, "Bateria"] as [string, string]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
          <ReferenceLine y={BATTERY_MIN_VOLTAGE} stroke="var(--destructive)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="voltage" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
