import { describe, expect, it } from "vitest";
import {
  maintenanceProgressionByVehicleType,
  monthlyCosts,
  monthlyMaintenanceByVehicleType,
  totalMaintenanceCost,
  vehicleCostSummaries,
} from "./aggregate";

describe("totalMaintenanceCost", () => {
  it("soma o custo de manutenção, ignorando nulos", () => {
    const result = totalMaintenanceCost([{ cost: 200 }, { cost: null }, { cost: 50 }]);
    expect(result).toBe(250);
  });
});

describe("monthlyCosts", () => {
  it("agrupa por mês (YYYY-MM)", () => {
    const result = monthlyCosts([
      { event_date: "2026-01-20", cost: 300 },
      { event_date: "2026-02-05", cost: 50 },
    ]);
    expect(result).toEqual([
      { month: "2026-01", cost: 300 },
      { month: "2026-02", cost: 50 },
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

describe("maintenanceProgressionByVehicleType", () => {
  it("acumula o custo por tipo, um degrau por data de evento", () => {
    const vehicleTypeById = new Map<string, "jet_ski" | "lancha" | "outro">([
      ["v1", "jet_ski"],
      ["v2", "lancha"],
    ]);
    const result = maintenanceProgressionByVehicleType(
      [
        { event_date: "2026-01-10", cost: 100, vehicle_id: "v1" },
        { event_date: "2026-01-20", cost: 200, vehicle_id: "v2" },
        { event_date: "2026-02-05", cost: 50, vehicle_id: "v1" },
      ],
      vehicleTypeById
    );
    expect(result).toEqual([
      { date: "2026-01-10", jet_ski: 100, lancha: 0, outro: 0 },
      { date: "2026-01-20", jet_ski: 100, lancha: 200, outro: 0 },
      { date: "2026-02-05", jet_ski: 150, lancha: 200, outro: 0 },
    ]);
  });

  it("mantém só um ponto por data, com o acumulado mais recente daquele dia", () => {
    const vehicleTypeById = new Map<string, "jet_ski" | "lancha" | "outro">([["v1", "jet_ski"]]);
    const result = maintenanceProgressionByVehicleType(
      [
        { event_date: "2026-01-10", cost: 100, vehicle_id: "v1" },
        { event_date: "2026-01-10", cost: 50, vehicle_id: "v1" },
      ],
      vehicleTypeById
    );
    expect(result).toEqual([{ date: "2026-01-10", jet_ski: 150, lancha: 0, outro: 0 }]);
  });
});

describe("vehicleCostSummaries", () => {
  it("soma custos e conta revisões por veículo", () => {
    const result = vehicleCostSummaries(
      ["v1", "v2"],
      [
        { vehicle_id: "v1", cost: 300, is_revision: true },
        { vehicle_id: "v1", cost: 50, is_revision: false },
      ]
    );
    expect(result.get("v1")).toEqual({
      vehicleId: "v1",
      totalMaintenance: 350,
      revisionCount: 1,
    });
    expect(result.get("v2")).toEqual({
      vehicleId: "v2",
      totalMaintenance: 0,
      revisionCount: 0,
    });
  });
});
