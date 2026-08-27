import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { compareVehiclesByModel, costByPeriodAndModel, modelGroupKey } from "@/lib/reports/compare-models";
import { VEHICLE_TYPE_LABELS, type MaintenanceEvent, type Vehicle } from "@/types/domain";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1C1A1B" },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFD9A441" }, bold: true };

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

/**
 * Exportação de relatório comparativo (mensal/anual, por modelo) direto em
 * .xlsx — admin-only, gerada sob demanda (sem depender de nenhum serviço
 * externo, só ExcelJS rodando aqui no servidor).
 */
export async function GET() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    return NextResponse.json({ error: "Restrito a administradores." }, { status: 403 });
  }

  const supabase = await createClient();
  const [{ data: vehicles }, { data: hourReadings }, { data: batteryReadings }, { data: events }] =
    await Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("engine_hour_readings").select("*"),
      supabase.from("battery_readings").select("*"),
      supabase.from("maintenance_events").select("*"),
    ]);

  const vehicleList = (vehicles as Vehicle[] | null) ?? [];
  const eventList = (events as MaintenanceEvent[] | null) ?? [];
  const modelByVehicleId = new Map(vehicleList.map((v) => [v.id, modelGroupKey(v)]));

  const comparisonRows = compareVehiclesByModel(vehicleList, hourReadings ?? [], batteryReadings ?? [], eventList);
  const monthlyRows = costByPeriodAndModel(eventList, modelByVehicleId, "month");
  const yearlyRows = costByPeriodAndModel(eventList, modelByVehicleId, "year");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jump Frota";
  workbook.created = new Date();

  // --- Aba 1: Comparativo por modelo (snapshot atual) ---
  const compareSheet = workbook.addWorksheet("Comparativo por modelo");
  compareSheet.columns = [
    { header: "Modelo", key: "model", width: 28 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Qtd. veículos", key: "count", width: 14 },
    { header: "Horas médias", key: "avgHours", width: 14 },
    { header: "Custo manutenção (R$)", key: "cost", width: 20 },
    { header: "Custo/veículo (R$)", key: "costPerVehicle", width: 18 },
    { header: "Custo/hora (R$)", key: "costPerHour", width: 16 },
    { header: "% bateria baixa", key: "batteryLow", width: 16 },
    { header: "Dias entre revisões", key: "daysBetweenRevisions", width: 18 },
    { header: "Nº revisões", key: "revisionCount", width: 12 },
  ];
  styleHeaderRow(compareSheet.getRow(1));
  for (const row of comparisonRows) {
    compareSheet.addRow({
      model: row.model,
      type: VEHICLE_TYPE_LABELS[row.vehicleType],
      count: row.vehicleCount,
      avgHours: row.avgHours !== null ? Number(row.avgHours.toFixed(1)) : null,
      cost: Number(row.totalMaintenanceCost.toFixed(2)),
      costPerVehicle: Number(row.avgMaintenanceCostPerVehicle.toFixed(2)),
      costPerHour: row.costPerHour !== null ? Number(row.costPerHour.toFixed(2)) : null,
      batteryLow: row.batteryLowRatePercent !== null ? Number(row.batteryLowRatePercent.toFixed(0)) : null,
      daysBetweenRevisions:
        row.avgDaysBetweenRevisions !== null ? Number(row.avgDaysBetweenRevisions.toFixed(0)) : null,
      revisionCount: row.revisionCount,
    });
  }

  // --- Abas 2 e 3: pivot mensal/anual, uma coluna por modelo ---
  addPivotSheet(workbook, "Mensal por modelo", "Mês", monthlyRows);
  addPivotSheet(workbook, "Anual por modelo", "Ano", yearlyRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `jump-frota-comparativo-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function addPivotSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  periodLabel: string,
  rows: { period: string; model: string; cost: number }[]
) {
  const sheet = workbook.addWorksheet(name);

  const models = [...new Set(rows.map((r) => r.model))].sort();
  const periods = [...new Set(rows.map((r) => r.period))].sort();

  sheet.columns = [
    { header: periodLabel, key: "period", width: 14 },
    ...models.map((m) => ({ header: m, key: m, width: 20 })),
    { header: "Total", key: "total", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const costByPeriodModel = new Map<string, number>();
  for (const r of rows) costByPeriodModel.set(`${r.period}${r.model}`, r.cost);

  for (const period of periods) {
    const rowData: Record<string, string | number> = { period };
    let total = 0;
    for (const model of models) {
      const cost = costByPeriodModel.get(`${period}${model}`) ?? 0;
      rowData[model] = Number(cost.toFixed(2));
      total += cost;
    }
    rowData.total = Number(total.toFixed(2));
    sheet.addRow(rowData);
  }
}
