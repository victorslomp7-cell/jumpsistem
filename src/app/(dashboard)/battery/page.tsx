import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BatteryOverviewTable } from "@/components/battery/battery-overview-table";
import { buildBatteryOverview, lastNDateKeys } from "@/lib/battery/overview";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/domain";

/*
 * Visão geral de bateria — pedida pelo cliente pra bater o olho em todos os
 * jet skis de uma vez (nome + tensão por dia), no mesmo formato da planilha
 * que a empresa já usa hoje pra acompanhar isso manualmente. Não é
 * relatório financeiro (não é admin-only) — é operacional, mesma visibilidade
 * das outras telas de bateria/horas que o funcionário já usa em campo.
 */

const DAY_OPTIONS = [3, 7, 14, 30] as const;
const DEFAULT_DAYS = 7;

// Janela do export em .xlsx é separada do seletor da tabela acima (o
// cliente pediu especificamente 30/60/90 dias pro relatório) e cobre todos
// os veículos, não só jet ski — ver src/app/api/reports/battery-overview/export.
const EXPORT_DAY_OPTIONS = [30, 60, 90] as const;

function parseDays(raw: string | undefined): number {
  const n = Number(raw);
  return (DAY_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_DAYS;
}

export default async function BatteryOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = parseDays(rawDays);

  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("type", "jet_ski")
    .is("deleted_at", null)
    .order("nickname");

  const jetSkis = (vehicles as Vehicle[] | null) ?? [];
  const vehicleIds = jetSkis.map((v) => v.id);

  const dateKeys = lastNDateKeys(days);
  // Corte um pouco mais largo que a janela exibida — só evita perder leitura
  // de borda; quem decide o que aparece na tabela é buildBatteryOverview.
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (days + 1));
  const cutoff = cutoffDate.toISOString();

  const { data: readings } =
    vehicleIds.length > 0
      ? await supabase
          .from("battery_readings")
          .select("vehicle_id, voltage, read_at")
          .in("vehicle_id", vehicleIds)
          .gte("read_at", cutoff)
      : { data: [] as { vehicle_id: string; voltage: number; read_at: string }[] };

  const rows = buildBatteryOverview(
    jetSkis.map((v) => ({ id: v.id, nickname: v.nickname })),
    (readings as { vehicle_id: string; voltage: number; read_at: string }[] | null) ?? [],
    dateKeys
  );

  const vehicleHrefById = new Map(jetSkis.map((v) => [v.id, `/vehicles/${v.id}/battery`]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Baterias — visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Tensão de cada jet ski por dia · {jetSkis.length} jet ski{jetSkis.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          {DAY_OPTIONS.map((n) => (
            <Link
              key={n}
              href={`/battery?days=${n}`}
              className={cn(
                buttonVariants({ size: "sm", variant: n === days ? "primary" : "ghost" }),
                "h-7 px-3 text-xs"
              )}
            >
              {n}d
            </Link>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <BatteryOverviewTable rows={rows} dateKeys={dateKeys} vehicleHrefById={vehicleHrefById} />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium">Exportar relatório em Excel</p>
          <p className="text-sm text-muted-foreground">
            Todos os veículos (jet ski e lancha), uma leitura por dia no período.
          </p>
        </div>
        <div className="flex gap-2">
          {EXPORT_DAY_OPTIONS.map((n) => (
            <a
              key={n}
              href={`/api/reports/battery-overview/export?days=${n}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {n} dias
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
