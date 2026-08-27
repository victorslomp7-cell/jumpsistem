/**
 * Estilo compartilhado dos relatórios em .xlsx (ExcelJS) — usado tanto pelo
 * comparativo por modelo (`/api/reports/comparativo/export`) quanto pela
 * visão geral de bateria (`/api/reports/battery-overview/export`), pra
 * qualquer planilha gerada pelo sistema sair com a mesma identidade
 * (navy + dourado da marca) em vez de cada rota inventar o próprio visual.
 */

import type ExcelJS from "exceljs";

export const BRAND_NAVY = "FF0A2540";
export const BRAND_NAVY_LIGHT = "FF123A5C";
export const BRAND_GOLD = "FFD9A441";
export const BRAND_GOLD_LIGHT = "FFFBF3E0";
export const ROW_BAND_FILL = "FFF6F1E4";
export const BORDER_COLOR = "FFE2D9C2";

export const TITLE_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_NAVY } };
export const TITLE_FONT: Partial<ExcelJS.Font> = { color: { argb: BRAND_GOLD }, bold: true, size: 14 };
export const SUBTITLE_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, italic: true, size: 10 };

export const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_NAVY_LIGHT } };
export const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: BRAND_GOLD }, bold: true };

/** Letra(s) de coluna do Excel pra um índice 1-based (1→A, 26→Z, 27→AA, ...). */
export function columnLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

/**
 * Banner de título mesclado no topo da aba (linha 1 = título, linha 2 =
 * subtítulo/data) — dá uma "capa" pra planilha em vez de começar direto no
 * cabeçalho da tabela. Retorna o número da linha onde o cabeçalho da
 * tabela deve começar (sempre a linha 4, deixando uma linha em branco
 * depois do banner).
 */
export function addTitleBanner(sheet: ExcelJS.Worksheet, title: string, subtitle: string, columnCount: number): number {
  const lastCol = columnLetter(columnCount);

  sheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = TITLE_FONT;
  titleCell.fill = TITLE_FILL;
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(`A2:${lastCol}2`);
  const subtitleCell = sheet.getCell("A2");
  subtitleCell.value = subtitle;
  subtitleCell.font = SUBTITLE_FONT;
  subtitleCell.fill = TITLE_FILL;
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(2).height = 18;

  // Linha 3 fica em branco (respiro visual entre o banner e a tabela).
  return 4;
}

/** Aplica o visual navy+dourado no cabeçalho da tabela (não no banner). */
export function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = THIN_BORDER;
  });
  row.height = 20;
}

/** Zebra stripe + borda fina nas linhas de dado, de `startRow` até a última linha da aba. */
export function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number) {
  for (let i = startRow; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const isEven = (i - startRow) % 2 === 1;
    row.eachCell((cell) => {
      cell.border = THIN_BORDER;
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ROW_BAND_FILL } };
      }
    });
  }
}

/** Congela o cabeçalho (e, opcionalmente, colunas fixas) e liga o autofiltro nele. */
export function freezeAndFilter(sheet: ExcelJS.Worksheet, headerRow: number, columnCount: number, freezeCols = 0) {
  sheet.views = [{ state: "frozen", xSplit: freezeCols, ySplit: headerRow }];
  const lastCol = columnLetter(columnCount);
  sheet.autoFilter = { from: `A${headerRow}`, to: `${lastCol}${headerRow}` };
}
