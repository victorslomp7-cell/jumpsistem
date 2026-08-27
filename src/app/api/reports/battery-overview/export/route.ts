import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildBatteryOverview, lastNDateKeys } from "@/lib/battery/overview";
import { VEHICLE_TYPE_LABELS, type Vehicle } from "@/types/domain";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1C1A1B" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFD9A441" }, bold: true };

// Mesmo destaque visual da tela /battery (bg-warning/25 + texto warning),
// só que em cores sólidas — .xlsx não tem opacidade de camada.
const LOW_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9E4B0" } };
const LOW_FONT: Partial<ExcelJS.Font> = { color: { argb: "FF8A5F16" }, bold: true };

const ALLOWED_DAYS = [30, 60, 90] as const;
const DEFAULT_DAYS = 30;

function parseDays(raw: string | null): number {
  const n = Number(raw);
  return (ALLOWED_DAYS as readonly number[]).includes(n) ? n : DEFAULT_DAYS;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

/**
 * Exportação em .xlsx da bateria dos últimos 30/60/90 dias, de todos os
 * veículos (jet ski e lancha — diferente da tela /battery, que só mostra
 * jet ski). Mesmo formato de matriz (veículo x dia) da planilha que a
 * empresa já usa hoje. Não é admin-only: mesma visibilidade da tela de
 * bateria, que o funcionário também usa em campo.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const days = parseDays(new URL(request.url).searchParams.get("days"));

  // Inclui veículos arquivados também: uma leitura baixa antes de o
  // veículo sair da frota continua sendo um dado real do período.
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("type").order("nickname");
  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const vehicleIds = vehicleList.map((v) => v.id);

  const dateKeys = lastNDateKeys(days);
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

  const rowsByVehicle = buildBatteryOverview(
    vehicleList.map((v) => ({ id: v.id, nickname: v.nickname })),
    (readings as { vehicle_id: string; voltage: number; read_at: string }[] | null) ?? [],
    dateKeys
  );
  const rowById = new Map(rowsByVehicle.map((r) => [r.vehicleId, r]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jump Frota";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Bateria — últimos ${days} dias`);
  sheet.columns = [
    { header: "Veículo", key: "nickname", width: 18 },
    { header: "Tipo", key: "type", width: 12 },
    ...dateKeys.map((date) => ({ header: formatHeaderDate(date), key: date, width: 10 })),
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

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
      excelCell.fill = LOW_FILL;
      excelCell.font = LOW_FONT;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `jump-frota-bateria-${days}dias-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function formatHeaderDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${day}/${month}`;
}
