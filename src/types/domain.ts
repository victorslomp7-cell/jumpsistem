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
