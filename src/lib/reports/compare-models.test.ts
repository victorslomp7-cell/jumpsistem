import { describe, expect, it } from "vitest";
import { compareVehiclesByModel, costByPeriodAndModel, modelGroupKey } from "./compare-models";

describe("modelGroupKey", () => {
  it("usa o modelo quando preenchido", () => {
    expect(modelGroupKey({ model: "Sea-Doo GTI 170", type: "jet_ski" })).toBe("Sea-Doo GTI 170");
  });

  it("agrupa por tipo quando o modelo esta vazio", () => {
    expect(modelGroupKey({ model: null, type: "jet_ski" })).toBe("jet_ski (sem modelo)");
    expect(modelGroupKey({ model: "   ", type: "lancha" })).toBe("lancha (sem modelo)");
  });
});

describe("compareVehiclesByModel", () => {
  const vehicles = [
    { id: "v1", model: "Sea-Doo GTI 170", type: "jet_ski" as const },
    { id: "v2", model: "Sea-Doo GTI 170", type: "jet_ski" as const },
    { id: "v3", model: "NHD 260", type: "lancha" as const },
  ];

  it("conta veiculos por modelo", () => {
    const result = compareVehiclesByModel(vehicles, [], [], []);
    const gti = result.find((r) => r.model === "Sea-Doo GTI 170")!;
    const nhd = result.find((r) => r.model === "NHD 260")!;
    expect(gti.vehicleCount).toBe(2);
    expect(nhd.vehicleCount).toBe(1);
  });

  it("soma custo de manutencao e calcula media por veiculo", () => {
    const events = [
      { vehicle_id: "v1", cost: 100, is_revision: false, event_date: "2026-01-01" },
      { vehicle_id: "v2", cost: 300, is_revision: false, event_date: "2026-01-02" },
    ];
    const result = compareVehiclesByModel(vehicles, [], [], events);
    const gti = result.find((r) => r.model === "Sea-Doo GTI 170")!;
    expect(gti.totalMaintenanceCost).toBe(400);
    expect(gti.avgMaintenanceCostPerVehicle).toBe(200);
  });

  it("usa a ultima leitura de horas de cada veiculo pra media e custo/hora", () => {
    const hourReadings = [
      { vehicle_id: "v1", hours: 40, read_at: "2026-01-01T00:00:00Z" },
      { vehicle_id: "v1", hours: 50, read_at: "2026-02-01T00:00:00Z" }, // mais recente, vale essa
      { vehicle_id: "v2", hours: 30, read_at: "2026-01-15T00:00:00Z" },
    ];
    const events = [{ vehicle_id: "v1", cost: 80, is_revision: false, event_date: "2026-01-10" }];
    const result = compareVehiclesByModel(vehicles, hourReadings, [], events);
    const gti = result.find((r) => r.model === "Sea-Doo GTI 170")!;
    expect(gti.avgHours).toBe(40); // (50 + 30) / 2
    expect(gti.costPerHour).toBeCloseTo(80 / 80); // custo 80 / (50+30) horas
  });

  it("calcula % de leituras de bateria abaixo de 12V", () => {
    const batteryReadings = [
      { vehicle_id: "v1", voltage: 11.5 },
      { vehicle_id: "v1", voltage: 12.8 },
      { vehicle_id: "v2", voltage: 11.0 },
      { vehicle_id: "v2", voltage: 11.9 },
    ];
    const result = compareVehiclesByModel(vehicles, [], batteryReadings, []);
    const gti = result.find((r) => r.model === "Sea-Doo GTI 170")!;
    expect(gti.batteryLowRatePercent).toBe(75); // 3 de 4 leituras < 12V
  });

  it("modelo sem nenhuma leitura de bateria fica com batteryLowRatePercent null", () => {
    const result = compareVehiclesByModel(vehicles, [], [], []);
    const nhd = result.find((r) => r.model === "NHD 260")!;
    expect(nhd.batteryLowRatePercent).toBeNull();
  });

  it("calcula intervalo medio entre revisoes (precisa de pelo menos 2)", () => {
    const events = [
      { vehicle_id: "v1", cost: null, is_revision: true, event_date: "2026-01-01" },
      { vehicle_id: "v1", cost: null, is_revision: true, event_date: "2026-03-02" }, // 60 dias depois
    ];
    const result = compareVehiclesByModel(vehicles, [], [], events);
    const gti = result.find((r) => r.model === "Sea-Doo GTI 170")!;
    expect(gti.avgDaysBetweenRevisions).toBe(60);
    expect(gti.revisionCount).toBe(2);
  });

  it("veiculo com só 1 revisao nao entra no calculo de intervalo", () => {
    const events = [{ vehicle_id: "v3", cost: null, is_revision: true, event_date: "2026-01-01" }];
    const result = compareVehiclesByModel(vehicles, [], [], events);
    const nhd = result.find((r) => r.model === "NHD 260")!;
    expect(nhd.avgDaysBetweenRevisions).toBeNull();
    expect(nhd.revisionCount).toBe(1);
  });
});

describe("costByPeriodAndModel", () => {
  it("agrupa por mes e por modelo sem misturar nomes com espaco", () => {
    const modelByVehicleId = new Map([
      ["v1", "Sea-Doo GTI 170"],
      ["v2", "NHD 260"],
    ]);
    const events = [
      { vehicle_id: "v1", cost: 100, event_date: "2026-01-05" },
      { vehicle_id: "v2", cost: 200, event_date: "2026-01-20" },
      { vehicle_id: "v1", cost: 50, event_date: "2026-02-01" },
    ];
    const result = costByPeriodAndModel(events, modelByVehicleId, "month");
    expect(result).toEqual([
      { period: "2026-01", model: "NHD 260", cost: 200 },
      { period: "2026-01", model: "Sea-Doo GTI 170", cost: 100 },
      { period: "2026-02", model: "Sea-Doo GTI 170", cost: 50 },
    ]);
  });

  it("agrupa por ano quando granularity é year", () => {
    const modelByVehicleId = new Map([["v1", "Sea-Doo GTI 170"]]);
    const events = [
      { vehicle_id: "v1", cost: 100, event_date: "2026-01-05" },
      { vehicle_id: "v1", cost: 50, event_date: "2026-11-01" },
    ];
    const result = costByPeriodAndModel(events, modelByVehicleId, "year");
    expect(result).toEqual([{ period: "2026", model: "Sea-Doo GTI 170", cost: 150 }]);
  });
});
