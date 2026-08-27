/**
 * Regras de revisão por horas de motor — puras, sem I/O, para serem
 * testadas de forma isolada (Vitest, a partir da Fase 3).
 *
 * Cada veículo tem `revisionIntervalHours` (default 50h jet ski / 100h
 * lancha) e `revisionWarningHours` (default 10h / 20h), ambos configuráveis
 * por veículo — inclusive para o tipo "outro" (veículos em geral).
 */

export const DEFAULT_REVISION_RULES = {
  jet_ski: { intervalHours: 50, warningHours: 10 },
  lancha: { intervalHours: 100, warningHours: 20 },
} as const;

export type RevisionStatus = "ok" | "aviso" | "vencida";

export interface RevisionInput {
  currentHours: number;
  hoursAtLastRevision: number; // 0 se nunca revisado
  revisionIntervalHours: number;
  revisionWarningHours: number;
}

export interface RevisionOutcome {
  hoursSinceLastRevision: number;
  hoursUntilNextRevision: number;
  status: RevisionStatus;
}

export function evaluateRevision(input: RevisionInput): RevisionOutcome {
  const hoursSinceLastRevision = input.currentHours - input.hoursAtLastRevision;
  const hoursUntilNextRevision = input.revisionIntervalHours - hoursSinceLastRevision;

  let status: RevisionStatus = "ok";
  if (hoursUntilNextRevision <= 0) {
    status = "vencida";
  } else if (hoursUntilNextRevision <= input.revisionWarningHours) {
    status = "aviso";
  }

  return { hoursSinceLastRevision, hoursUntilNextRevision, status };
}
