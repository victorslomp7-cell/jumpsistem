import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { compareVehiclesByModel, costByPeriodAndModel, modelGroupKey } from "@/lib/reports/compare-models";
import {
  addTitleBanner,
  columnLetter,
  freezeAndFilter,
  styleDataRows,
  styleHeaderRow,
} from "@/lib/reports/excel-style";
import { VEHICLE_TYPE_LABELS, type MaintenanceEvent, type Vehicle } from "@/types/domain";

const GENERATED_AT = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * Exportação de relatório comparativo (mensal/anual, por modelo) direto em
 * .xlsx — admin-only, gerada sob demanda (sem depender de nenhum serviço
 * externo, só ExcelJS rodando aqui no servidor). Estilo compartilhado com
 * o export de bateria em src/lib/reports/excel-style.ts, pra sair com a
 * mesma identidade (navy + dourado, banner de título, linhas zebradas).
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

  const generatedAt = GENERATED_AT();

  // --- Aba 1: Comparativo por modelo (snapshot atual) ---
  const compareSheet = workbook.addWorksheet("Comparativo por modelo");
  compareSheet.columns = [
    { key: "model", width: 28 },
    { key: "type", width: 12 },
    { key: "count", width: 14 },
    { key: "avgHours", width: 14 },
    { key: "cost", width: 20 },
    { key: "costPerVehicle", width: 18 },
    { key: "costPerHour", width: 16 },
    { key: "batteryLow", width: 16 },
    { key: "daysBetweenRevisions", width: 18 },
    { key: "revisionCount", width: 12 },
  ];
  const compareHeaderRow = addTitleBanner(
    compareSheet,
    "Jump Frota — Comparativo por modelo",
    `Jet skis e lanchas, snapshot atual (inclui veículos já removidos) · gerado em ${generatedAt}`,
    compareSheet.columns.length
  );
  compareSheet.getRow(compareHeaderRow).values = [
    "Modelo",
    "Tipo",
    "Qtd. veículos",
    "Horas médias",
    "Custo manutenção",
    "Custo/veículo",
    "Custo/hora",
    "% bateria baixa",
    "Dias entre revisões",
    "Nº revisões",
  ];
  styleHeaderRow(compareSheet.getRow(compareHeaderRow));

  for (const row of comparisonRows) {
    compareSheet.addRow({
      model: row.model,
      type: VEHICLE_TYPE_LABELS[row.vehicleType],
      count: row.vehicleCount,
      avgHours: row.avgHours !== null ? Number(row.avgHours.toFixed(1)) : null,
      cost: Number(row.totalMaintenanceCost.toFixed(2)),
      costPerVehicle: Number(row.avgMaintenanceCostPerVehicle.toFixed(2)),
      costPerHour: row.costPerHour !== null ? Number(row.costPerHour.toFixed(2)) : null,
      batteryLow: row.batteryLowRatePercent !== null ? Number((row.batteryLowRatePercent / 100).toFixed(3)) : null,
      daysBetweenRevisions:
        row.avgDaysBetweenRevisions !== null ? Number(row.avgDaysBetweenRevisions.toFixed(0)) : null,
      revisionCount: row.revisionCount,
    });
  }

  applyColumnFormat(compareSheet, "E", compareHeaderRow, "R$ #,##0.00");
  applyColumnFormat(compareSheet, "F", compareHeaderRow, "R$ #,##0.00");
  applyColumnFormat(compareSheet, "G", compareHeaderRow, "R$ #,##0.00");
  applyColumnFormat(compareSheet, "H", compareHeaderRow, "0%");
  styleDataRows(compareSheet, compareHeaderRow + 1);
  freezeAndFilter(compareSheet, compareHeaderRow, compareSheet.columns.length);

  // --- Abas 2 e 3: pivot mensal/anual, uma coluna por modelo ---
  addPivotSheet(workbook, "Mensal por modelo", "Mês", monthlyRows, generatedAt);
  addPivotSheet(workbook, "Anual por modelo", "Ano", yearlyRows, generatedAt);

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `jump-frota-comparativo-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function applyColumnFormat(sheet: ExcelJS.Worksheet, col: string, headerRow: number, numFmt: string) {
  sheet.getColumn(col).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
    if (rowNumber > headerRow) cell.numFmt = numFmt;
  });
}

function addPivotSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  periodLabel: string,
  rows: { period: string; model: string; cost: number }[],
  generatedAt: string
) {
  const sheet = workbook.addWorksheet(name);

  const models = [...new Set(rows.map((r) => r.model))].sort();
  const periods = [...new Set(rows.map((r) => r.period))].sort();
  const columnCount = 2 + models.length;

  sheet.columns = [
    { key: "period", width: 14 },
    ...models.map((m) => ({ key: m, width: 20 })),
    { key: "total", width: 16 },
  ];
  const headerRow = addTitleBanner(
    sheet,
    `Jump Frota — Custo de manutenção (${name})`,
    `Uma coluna por modelo · gerado em ${generatedAt}`,
    columnCount
  );
  sheet.getRow(headerRow).values = [periodLabel, ...models, "Total"];
  styleHeaderRow(sheet.getRow(headerRow));

  const costByPeriodModel = new Map<string, number>();
  for (const r of rows) costByPeriodModel.set(`${r.period}${r.model}`, r.cost);

  for (const period of periods) {
    const rowData: Record<string, string | number> = { period };
    let total = 0;
    for (const model of models) {
      const cost = costByPeriodModel.get(`${period}${model}`) ?? 0;
      rowData[model] = Number(cost.toFixed(2));
      total += cost;
    }
    rowData.total = Number(total.toFixed(2));
    const addedRow = sheet.addRow(rowData);
    addedRow.getCell(columnCount).font = { bold: true };
  }

  for (let col = 2; col <= columnCount; col++) {
    applyColumnFormat(sheet, columnLetter(col), headerRow, "R$ #,##0.00");
  }
  styleDataRows(sheet, headerRow + 1);
  freezeAndFilter(sheet, headerRow, columnCount, 1);
}
