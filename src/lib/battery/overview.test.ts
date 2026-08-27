import { describe, expect, it } from "vitest";
import { buildBatteryOverview, lastNDateKeys, toDateKeyInTimezone } from "./overview";

describe("toDateKeyInTimezone", () => {
  it("converte um instante UTC pro dia civil em São Paulo (UTC-3)", () => {
    // 02:30 UTC do dia 25 é 23:30 do dia 24 em São Paulo.
    expect(toDateKeyInTimezone("2026-08-25T02:30:00Z")).toBe("2026-08-24");
  });

  it("mantém o mesmo dia quando o horário já está bem dentro do dia em São Paulo", () => {
    expect(toDateKeyInTimezone("2026-08-24T15:00:00Z")).toBe("2026-08-24");
  });
});

describe("lastNDateKeys", () => {
  it("retorna N dias consecutivos crescentes, incluindo hoje", () => {
    const now = new Date("2026-08-27T18:00:00Z"); // 15h em São Paulo
    expect(lastNDateKeys(4, now)).toEqual(["2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27"]);
  });

  it("respeita pelo menos os últimos 3 dias quando pedido", () => {
    const now = new Date("2026-08-27T18:00:00Z");
    expect(lastNDateKeys(3, now)).toEqual(["2026-08-25", "2026-08-26", "2026-08-27"]);
  });
});

describe("buildBatteryOverview", () => {
  const vehicles = [
    { id: "v1", nickname: "170A1102" },
    { id: "v2", nickname: "155B110" },
  ];
  const dateKeys = ["2026-08-24", "2026-08-25", "2026-08-26"];

  it("ordena por apelido e marca dia sem leitura como null", () => {
    const rows = buildBatteryOverview(vehicles, [], dateKeys);
    expect(rows.map((r) => r.nickname)).toEqual(["155B110", "170A1102"]);
    expect(rows[0].cells).toEqual([
      { date: "2026-08-24", voltage: null, low: false },
      { date: "2026-08-25", voltage: null, low: false },
      { date: "2026-08-26", voltage: null, low: false },
    ]);
  });

  it("marca low quando a tensão fica abaixo de 12V", () => {
    const readings = [{ vehicle_id: "v1", voltage: 11.7, read_at: "2026-08-25T15:00:00Z" }];
    const rows = buildBatteryOverview(vehicles, readings, dateKeys);
    const row = rows.find((r) => r.vehicleId === "v1")!;
    expect(row.cells[1]).toEqual({ date: "2026-08-25", voltage: 11.7, low: true });
  });

  it("usa a leitura mais recente quando há mais de uma no mesmo dia", () => {
    const readings = [
      { vehicle_id: "v1", voltage: 12.6, read_at: "2026-08-25T12:00:00Z" },
      { vehicle_id: "v1", voltage: 11.9, read_at: "2026-08-25T20:00:00Z" },
    ];
    const rows = buildBatteryOverview(vehicles, readings, dateKeys);
    const row = rows.find((r) => r.vehicleId === "v1")!;
    expect(row.cells[1]).toEqual({ date: "2026-08-25", voltage: 11.9, low: true });
  });

  it("ignora leituras fora da janela de dias pedida", () => {
    const readings = [{ vehicle_id: "v1", voltage: 9.0, read_at: "2026-08-01T12:00:00Z" }];
    const rows = buildBatteryOverview(vehicles, readings, dateKeys);
    const row = rows.find((r) => r.vehicleId === "v1")!;
    expect(row.cells.every((c) => c.voltage === null)).toBe(true);
  });
});
