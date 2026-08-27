import { describe, expect, it } from "vitest";
import {
  monthlyCosts,
  monthlyMaintenanceByVehicleType,
  totalCostByCategory,
  vehicleCostSummaries,
} from "./aggregate";

describe("totalCostByCategory", () => {
  it("soma abastecimento e manutenção separadamente", () => {
    const result = totalCostByCategory(
      [{ total_value: 100 }, { total_value: 50 }],
      [{ cost: 200 }, { cost: null }]
    );
    expect(result).toEqual({ refuels: 150, maintenance: 200 });
  });
});

describe("monthlyCosts", () => {
  it("agrupa por mês (YYYY-MM)", () => {
    const result = monthlyCosts(
      [
        { refuel_date: "2026-01-05", total_value: 100 },
        { refuel_date: "2026-02-10", total_value: 50 },
      ],
      [{ event_date: "2026-01-20", cost: 300 }]
    );
    expect(result).toEqual([
      { month: "2026-01", refuels: 100, maintenance: 300 },
      { month: "2026-02", refuels: 50, maintenance: 0 },
    ]);
  });
});

describe("monthlyMaintenanceByVehicleType", () => {
  it("destrincha custo de manutenção por tipo de veículo", () => {
    const vehicleTypeById = new Map<string, "jet_ski" | "lancha" | "outro">([
      ["v1", "jet_ski"],
      ["v2", "lancha"],
    ]);
    const result = monthlyMaintenanceByVehicleType(
      [
        { event_date: "2026-03-01", cost: 100, vehicle_id: "v1" },
        { event_date: "2026-03-15", cost: 200, vehicle_id: "v2" },
      ],
      vehicleTypeById
    );
    expect(result).toEqual([{ month: "2026-03", jet_ski: 100, lancha: 200, outro: 0 }]);
  });
});

describe("vehicleCostSummaries", () => {
  it("soma custos e conta revisões por veículo", () => {
    const result = vehicleCostSummaries(
      ["v1", "v2"],
      [
        { vehicle_id: "v1", total_value: 100 },
        { vehicle_id: "v2", total_value: 50 },
      ],
      [
        { vehicle_id: "v1", cost: 300, is_revision: true },
        { vehicle_id: "v1", cost: 50, is_revision: false },
      ]
    );
    expect(result.get("v1")).toEqual({
      vehicleId: "v1",
      totalRefuels: 100,
      totalMaintenance: 350,
      total: 450,
      revisionCount: 1,
    });
    expect(result.get("v2")).toEqual({
      vehicleId: "v2",
      totalRefuels: 50,
      totalMaintenance: 0,
      total: 50,
      revisionCount: 0,
    });
  });
});
