import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BatteryOverviewTable } from "@/components/battery/battery-overview-table";
import { buildBatteryOverview, daysInMonth, lastNDateKeys, shiftMonthKey, toDateKeyInTimezone } from "@/lib/battery/overview";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/domain";

/*
 * Visão geral de bateria — pedida pelo cliente pra bater o olho em todos os
 * veículos de uma vez (nome + tensão por dia), no mesmo formato da planilha
 * que a empresa já usa hoje pra acompanhar isso manualmente. Cobre jet ski
 * E lancha (pedido explícito do cliente: "as lanchas também tem bateria") —
 * a tabela tem uma coluna "Tipo" pra diferenciar. Não é relatório
 * financeiro (não é admin-only) — é operacional, mesma visibilidade das
 * outras telas de bateria/horas que o funcionário já usa em campo.
 *
 * Nada aqui é apagado (o cliente pediu explicitamente histórico
 * permanente): battery_readings não tem nenhuma rotina de limpeza — as
 * leituras já ficam guardadas pra sempre desde a Fase 2. O que faltava era
 * um jeito de *navegar* nesse histórico sem virar uma tabela de 600
 * colunas — daqui vêm os dois modos abaixo:
 * - janela corrida (3/7/14/30 dias) — checagem rápida do dia a dia;
 * - por mês civil (`?month=YYYY-MM`, com navegação anterior/próximo) — pra
 *   olhar pra trás com a mesma lógica da planilha antiga da empresa
 *   ("agosto", "setembro", ...), sem precisar de uma tabela gigante.
 * Pra ver literalmente tudo de uma vez (o caso dos "600 dias" que o
 * cliente descreveu), o caminho é o export em Excel com a opção "Histórico
 * completo" logo abaixo — planilha aguenta colunas de sobra, tela não.
 */

const DAY_OPTIONS = [3, 7, 14, 30] as const;
const DEFAULT_DAYS = 7;

function parseDays(raw: string | undefined): number {
  const n = Number(raw);
  return (DAY_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_DAYS;
}

function isValidMonthKey(raw: string | undefined): raw is string {
  return !!raw && /^\d{4}-\d{2}$/.test(raw);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function BatteryOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; month?: string }>;
}) {
  const { days: rawDays, month: rawMonth } = await searchParams;
  const isMonthMode = isValidMonthKey(rawMonth);
  const days = isMonthMode ? null : parseDays(rawDays);

  const now = new Date();
  const todayKey = toDateKeyInTimezone(now.toISOString());
  const currentMonthKey = todayKey.slice(0, 7);
  const monthKey = isMonthMode ? rawMonth : currentMonthKey;

  const dateKeys = isMonthMode ? daysInMonth(monthKey, now) : lastNDateKeys(days!, now);

  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .is("deleted_at", null)
    .order("nickname");

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const vehicleIds = vehicleList.map((v) => v.id);

  // Corte um pouco mais largo que a janela exibida (1 dia antes do primeiro
  // dia da tabela) — só evita perder leitura de borda; quem decide o que
  // aparece na tabela é buildBatteryOverview.
  const cutoffDate = new Date(`${dateKeys[0] ?? todayKey}T00:00:00Z`);
  cutoffDate.setDate(cutoffDate.getDate() - 1);
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
    vehicleList.map((v) => ({ id: v.id, nickname: v.nickname })),
    (readings as { vehicle_id: string; voltage: number; read_at: string }[] | null) ?? [],
    dateKeys
  );

  const vehicleHrefById = new Map(vehicleList.map((v) => [v.id, `/vehicles/${v.id}/battery`]));
  const vehicleTypeById = new Map(vehicleList.map((v) => [v.id, v.type]));

  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const nextMonthKey = shiftMonthKey(monthKey, 1);
  const canGoNextMonth = nextMonthKey <= currentMonthKey;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Baterias — visão geral</h1>
          <p className="text-sm text-muted-foreground">
            {isMonthMode
              ? `Tensão de cada veículo por dia — ${formatMonthLabel(monthKey)}`
              : `Tensão de cada veículo por dia · ${vehicleList.length} veículo${vehicleList.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-0.5">
          {DAY_OPTIONS.map((n) => (
            <Link
              key={n}
              href={`/battery?days=${n}`}
              className={cn(
                buttonVariants({ size: "sm", variant: !isMonthMode && n === days ? "primary" : "ghost" }),
                "h-7 px-3 text-xs"
              )}
            >
              {n}d
            </Link>
          ))}
          <Link
            href={`/battery?month=${currentMonthKey}`}
            className={cn(
              buttonVariants({ size: "sm", variant: isMonthMode ? "primary" : "ghost" }),
              "h-7 px-3 text-xs"
            )}
          >
            Por mês
          </Link>
        </div>
      </div>

      {isMonthMode && (
        <div className="flex items-center justify-center gap-3">
          <Link href={`/battery?month=${prevMonthKey}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            ← {formatMonthLabel(prevMonthKey)}
          </Link>
          <span className="min-w-40 text-center text-sm font-semibold">{formatMonthLabel(monthKey)}</span>
          {canGoNextMonth ? (
            <Link href={`/battery?month=${nextMonthKey}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {formatMonthLabel(nextMonthKey)} →
            </Link>
          ) : (
            <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-40")}>
              {formatMonthLabel(nextMonthKey)} →
            </span>
          )}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <BatteryOverviewTable
          rows={rows}
          dateKeys={dateKeys}
          vehicleHrefById={vehicleHrefById}
          vehicleTypeById={vehicleTypeById}
        />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium">Exportar relatório em Excel</p>
          <p className="text-sm text-muted-foreground">
            Todos os veículos (jet ski e lancha), uma leitura por dia no período. Nada é apagado — o histórico
            completo fica sempre disponível, mesmo que sejam centenas de dias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[30, 60, 90].map((n) => (
            <a
              key={n}
              href={`/api/reports/battery-overview/export?days=${n}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {n} dias
            </a>
          ))}
          <a
            href="/api/reports/battery-overview/export?days=all"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Histórico completo
          </a>
        </div>
      </Card>
    </div>
  );
}
