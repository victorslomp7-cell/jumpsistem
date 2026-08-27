import { describe, expect, it } from "vitest";
import { isBatteryLow, nextVehicleStatusAfterReading, BATTERY_MIN_VOLTAGE } from "./ingestion";

describe("isBatteryLow", () => {
  it(`é true abaixo de ${BATTERY_MIN_VOLTAGE}V`, () => {
    expect(isBatteryLow(11.9)).toBe(true);
    expect(isBatteryLow(0)).toBe(true);
  });

  it(`é false em ${BATTERY_MIN_VOLTAGE}V ou acima`, () => {
    expect(isBatteryLow(12)).toBe(false);
    expect(isBatteryLow(12.8)).toBe(false);
  });
});

describe("nextVehicleStatusAfterReading", () => {
  it("bloqueia um veículo disponível quando a leitura é baixa", () => {
    expect(nextVehicleStatusAfterReading("disponivel", 11.5)).toBe("bloqueado");
  });

  it("libera um veículo bloqueado quando a leitura volta ao normal", () => {
    expect(nextVehicleStatusAfterReading("bloqueado", 12.6)).toBe("disponivel");
  });

  it("mantém bloqueado se a leitura continua baixa", () => {
    expect(nextVehicleStatusAfterReading("bloqueado", 11.0)).toBe("bloqueado");
  });

  it("nunca tira um veículo de manutenção por causa da bateria", () => {
    expect(nextVehicleStatusAfterReading("manutencao", 11.0)).toBe("manutencao");
    expect(nextVehicleStatusAfterReading("manutencao", 12.8)).toBe("manutencao");
  });
});
