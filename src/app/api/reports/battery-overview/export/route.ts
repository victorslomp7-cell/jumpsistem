import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allDateKeysBetween, buildBatteryOverview, lastNDateKeys, toDateKeyInTimezone } from "@/lib/battery/overview";
import { addTitleBanner, freezeAndFilter, styleDataRows, styleHeaderRow } from "@/lib/reports/excel-style";
import { VEHICLE_TYPE_LABELS, type Vehicle } from "@/types/domain";

type ReadingRow = { vehicle_id: string; voltage: number; read_at: string };

const ALLOWED_WINDOW_DAYS = [30, 60, 90] as const;
const DEFAULT_WINDOW_DAYS = 30;

/**
 * Exportação em .xlsx da bateria de todos os veículos (jet ski e lancha —
 * diferente da tela /battery, que só mostra jet ski), inclusive
 * arquivados. Mesmo formato de matriz (veículo x dia) da planilha que a
 * empresa já usa hoje. Não é admin-only: mesma visibilidade da tela de
 * bateria, que o funcionário também usa em campo.
 *
 * `?days=30|60|90` — janela corrida a partir de hoje.
 * `?days=all` — histórico completo, desde a leitura mais antiga registrada
 * (pode passar de 600 dias/colunas — o cliente pediu explicitamente esse
 * alcance; .xlsx aguenta de boa, diferente de uma tabela na tela).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const rawDays = new URL(request.url).searchParams.get("days");
  const isFullHistory = rawDays === "all";

  // Inclui veículos arquivados também: uma leitura baixa antes de o
  // veículo sair da frota continua sendo um dado real do período.
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("type").order("nickname");
  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const vehicleIds = vehicleList.map((v) => v.id);

  const { dateKeys, cutoff, sheetLabel } = await resolveRange(supabase, isFullHistory, rawDays, vehicleIds);

  const { data: readings } =
    vehicleIds.length > 0
      ? await supabase
          .from("battery_readings")
          .select("vehicle_id, voltage, read_at")
          .in("vehicle_id", vehicleIds)
          .gte("read_at", cutoff)
      : { data: [] as ReadingRow[] };

  const rowsByVehicle = buildBatteryOverview(
    vehicleList.map((v) => ({ id: v.id, nickname: v.nickname })),
    (readings as ReadingRow[] | null) ?? [],
    dateKeys
  );
  const rowById = new Map(rowsByVehicle.map((r) => [r.vehicleId, r]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jump Frota";
  workbook.created = new Date();

  const columnCount = 2 + dateKeys.length;
  // Nome da aba não pode ter "/" nem passar de 31 caracteres (limite do
  // Excel) — o texto descritivo completo (com data "15/01" etc.) fica só
  // no banner de título dentro da planilha, não no nome da aba.
  const sheet = workbook.addWorksheet("Bateria");
  sheet.columns = [
    { key: "nickname", width: 18 },
    { key: "type", width: 12 },
    ...dateKeys.map((date) => ({ key: date, width: 10 })),
  ];
  const generatedAt = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const headerRow = addTitleBanner(
    sheet,
    "Jump Frota — Bateria por dia",
    `${sheetLabel} · todos os veículos, jet ski e lancha · gerado em ${generatedAt}`,
    columnCount
  );
  sheet.getRow(headerRow).values = ["Veículo", "Tipo", ...dateKeys.map(formatHeaderDate)];
  styleHeaderRow(sheet.getRow(headerRow));
  freezeAndFilter(sheet, headerRow, columnCount, 2);

  // Ordenado por tipo (jet ski primeiro) e depois apelido, igual a query.
  for (const vehicle of vehicleList) {
    const row = rowById.get(vehicle.id);
    if (!row) continue;

    const rowData: Record<string, string | number | null> = {
      nickname: vehicle.nickname,
      type: VEHICLE_TYPE_LABELS[vehicle.type],
    };
    for (const cell of row.cells) {
      rowData[cell.date] = cell.voltage !== null ? Number(cell.voltage.toFixed(2)) : null;
    }
    const addedRow = sheet.addRow(rowData);

    for (const cell of row.cells) {
      if (!cell.low) continue;
      const excelCell = addedRow.getCell(cell.date);
      excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9E4B0" } };
      excelCell.font = { color: { argb: "FF8A5F16" }, bold: true };
    }
  }

  styleDataRows(sheet, headerRow + 1);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileSuffix = isFullHistory ? "historico-completo" : `${dateKeys.length}dias`;
  const fileName = `jump-frota-bateria-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

async function resolveRange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  isFullHistory: boolean,
  rawDays: string | null,
  vehicleIds: string[]
): Promise<{ dateKeys: string[]; cutoff: string; sheetLabel: string }> {
  if (isFullHistory) {
    if (vehicleIds.length === 0) {
      return { dateKeys: [], cutoff: new Date(0).toISOString(), sheetLabel: "histórico completo" };
    }
    const { data: earliest } = await supabase
      .from("battery_readings")
      .select("read_at")
      .in("vehicle_id", vehicleIds)
      .order("read_at", { ascending: true })
      .limit(1);
    const earliestReadAt = earliest?.[0]?.read_at as string | undefined;
    if (!earliestReadAt) {
      return { dateKeys: [], cutoff: new Date().toISOString(), sheetLabel: "histórico completo" };
    }
    const startKey = toDateKeyInTimezone(earliestReadAt);
    const endKey = toDateKeyInTimezone(new Date().toISOString());
    return {
      dateKeys: allDateKeysBetween(startKey, endKey),
      cutoff: earliestReadAt,
      sheetLabel: `histórico completo (desde ${formatHeaderDate(startKey)})`,
    };
  }

  const n = Number(rawDays);
  const days = (ALLOWED_WINDOW_DAYS as readonly number[]).includes(n) ? n : DEFAULT_WINDOW_DAYS;
  const dateKeys = lastNDateKeys(days);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (days + 1));
  return { dateKeys, cutoff: cutoffDate.toISOString(), sheetLabel: `últimos ${days} dias` };
}

function formatHeaderDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}
