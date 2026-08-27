/**
 * Espelha `supabase/migrations/*.sql` manualmente — esta sessão não tem
 * acesso de rede ao Supabase (política de egress do ambiente) para rodar
 * `supabase gen types typescript`. Assim que alguém rodar esse comando com
 * acesso à rede, o resultado pode substituir este arquivo (formato é
 * compatível: `Database["public"]["Tables"]`).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "admin" | "funcionario";
          phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: "admin" | "funcionario";
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: "admin" | "funcionario";
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          nickname: string;
          type: "jet_ski" | "lancha" | "outro";
          model: string | null;
          plate: string | null;
          year: number | null;
          photo_url: string | null;
          revision_interval_hours: number | null;
          revision_warning_hours: number | null;
          battery_check_frequency_days: number | null;
          status: "disponivel" | "bloqueado" | "manutencao";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nickname: string;
          type: "jet_ski" | "lancha" | "outro";
          model?: string | null;
          plate?: string | null;
          year?: number | null;
          photo_url?: string | null;
          revision_interval_hours?: number | null;
          revision_warning_hours?: number | null;
          battery_check_frequency_days?: number | null;
          status?: "disponivel" | "bloqueado" | "manutencao";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          type?: "jet_ski" | "lancha" | "outro";
          model?: string | null;
          plate?: string | null;
          year?: number | null;
          photo_url?: string | null;
          revision_interval_hours?: number | null;
          revision_warning_hours?: number | null;
          battery_check_frequency_days?: number | null;
          status?: "disponivel" | "bloqueado" | "manutencao";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: "admin" | "funcionario";
      vehicle_type: "jet_ski" | "lancha" | "outro";
      vehicle_status: "disponivel" | "bloqueado" | "manutencao";
    };
    CompositeTypes: Record<string, never>;
  };
}
