import { describe, expect, it } from "vitest";
import { evaluateRevision, DEFAULT_REVISION_RULES } from "./revision";

describe("evaluateRevision", () => {
  const jetSki = DEFAULT_REVISION_RULES.jet_ski;

  it("fica 'ok' longe do intervalo", () => {
    const result = evaluateRevision({
      currentHours: 10,
      hoursAtLastRevision: 0,
      revisionIntervalHours: jetSki.intervalHours,
      revisionWarningHours: jetSki.warningHours,
    });
    expect(result.status).toBe("ok");
    expect(result.hoursUntilNextRevision).toBe(40);
  });

  it("fica 'aviso' dentro da janela de antecedência (jet ski: 10h antes de 50h)", () => {
    const result = evaluateRevision({
      currentHours: 41,
      hoursAtLastRevision: 0,
      revisionIntervalHours: jetSki.intervalHours,
      revisionWarningHours: jetSki.warningHours,
    });
    expect(result.status).toBe("aviso");
  });

  it("fica 'vencida' ao passar do intervalo", () => {
    const result = evaluateRevision({
      currentHours: 51,
      hoursAtLastRevision: 0,
      revisionIntervalHours: jetSki.intervalHours,
      revisionWarningHours: jetSki.warningHours,
    });
    expect(result.status).toBe("vencida");
  });

  it("reseta a contagem a partir da última revisão", () => {
    const result = evaluateRevision({
      currentHours: 105,
      hoursAtLastRevision: 100,
      revisionIntervalHours: jetSki.intervalHours,
      revisionWarningHours: jetSki.warningHours,
    });
    expect(result.hoursSinceLastRevision).toBe(5);
    expect(result.status).toBe("ok");
  });
});
