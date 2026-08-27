/**
 * Tipos de domínio espelhando `supabase/migrations/*.sql`.
 *
 * Mantidos manualmente por enquanto — esta sessão não tem acesso de rede ao
 * Supabase (política de egress do ambiente) para rodar
 * `supabase gen types typescript`. Assim que alguém rodar isso com acesso à
 * rede, `src/types/database.types.ts` pode substituir estes tipos.
 */

export type ProfileRole = "admin" | "funcionario";

export interface Profile {
  id: string;
  full_name: string;
  role: ProfileRole;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export type VehicleType = "jet_ski" | "lancha" | "outro";
export type VehicleStatus = "disponivel" | "bloqueado" | "manutencao";

export interface Vehicle {
  id: string;
  nickname: string;
  type: VehicleType;
  model: string | null;
  plate: string | null;
  year: number | null;
  photo_url: string | null;
  revision_interval_hours: number | null;
  revision_warning_hours: number | null;
  battery_check_frequency_days: number | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  jet_ski: "Jet ski",
  lancha: "Lancha",
  outro: "Outro",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  disponivel: "Disponível",
  bloqueado: "Bloqueado",
  manutencao: "Em manutenção",
};

/** Defaults sugeridos ao cadastrar — sempre editáveis pelo admin. */
export const REVISION_DEFAULTS: Record<VehicleType, { intervalHours: number | null; warningHours: number | null }> = {
  jet_ski: { intervalHours: 50, warningHours: 10 },
  lancha: { intervalHours: 100, warningHours: 20 },
  outro: { intervalHours: null, warningHours: null },
};

export type BatteryReadingSourceType = "manual" | "motorlog_api";

export interface BatteryReading {
  id: string;
  vehicle_id: string;
  voltage: number;
  read_at: string;
  source: BatteryReadingSourceType;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export type AlertType = "battery_low" | "revision_due" | "revision_overdue";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  vehicle_id: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  created_at: string;
  resolved_at: string | null;
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  battery_low: "Bateria baixa",
  revision_due: "Revisão próxima",
  revision_overdue: "Revisão vencida",
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: "Aberto",
  acknowledged: "Reconhecido",
  resolved: "Resolvido",
};

export interface EngineHourReading {
  id: string;
  vehicle_id: string;
  hours: number;
  read_at: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export type MaintenanceEventType = "revisao" | "troca_peca" | "troca_bateria" | "outro";

export interface MaintenanceEvent {
  id: string;
  vehicle_id: string;
  type: MaintenanceEventType;
  description: string;
  event_date: string;
  cost: number | null;
  budget: number | null;
  warranty_until: string | null;
  is_revision: boolean;
  hours_at_event: number | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
}

export const MAINTENANCE_EVENT_TYPE_LABELS: Record<MaintenanceEventType, string> = {
  revisao: "Revisão",
  troca_peca: "Troca de peça",
  troca_bateria: "Troca de bateria",
  outro: "Outro",
};
