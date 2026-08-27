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
      battery_readings: {
        Row: {
          id: string;
          vehicle_id: string;
          voltage: number;
          read_at: string;
          source: "manual" | "motorlog_api";
          recorded_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          voltage: number;
          read_at?: string;
          source?: "manual" | "motorlog_api";
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          voltage?: number;
          read_at?: string;
          source?: "manual" | "motorlog_api";
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          vehicle_id: string | null;
          type: "battery_low" | "revision_due" | "revision_overdue";
          severity: "info" | "warning" | "critical";
          message: string;
          status: "open" | "acknowledged" | "resolved";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id?: string | null;
          type: "battery_low" | "revision_due" | "revision_overdue";
          severity?: "info" | "warning" | "critical";
          message: string;
          status?: "open" | "acknowledged" | "resolved";
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string | null;
          type?: "battery_low" | "revision_due" | "revision_overdue";
          severity?: "info" | "warning" | "critical";
          message?: string;
          status?: "open" | "acknowledged" | "resolved";
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      engine_hour_readings: {
        Row: {
          id: string;
          vehicle_id: string;
          hours: number;
          read_at: string;
          recorded_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          hours: number;
          read_at?: string;
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          hours?: number;
          read_at?: string;
          recorded_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      maintenance_events: {
        Row: {
          id: string;
          vehicle_id: string;
          type: "revisao" | "troca_peca" | "troca_bateria" | "outro";
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
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          type: "revisao" | "troca_peca" | "troca_bateria" | "outro";
          description: string;
          event_date?: string;
          cost?: number | null;
          budget?: number | null;
          warranty_until?: string | null;
          is_revision?: boolean;
          hours_at_event?: number | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          type?: "revisao" | "troca_peca" | "troca_bateria" | "outro";
          description?: string;
          event_date?: string;
          cost?: number | null;
          budget?: number | null;
          warranty_until?: string | null;
          is_revision?: boolean;
          hours_at_event?: number | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      refuels: {
        Row: {
          id: string;
          vehicle_id: string;
          refuel_date: string;
          engine_hours: number | null;
          fuel_type: string;
          liters: number;
          price_per_liter: number | null;
          total_value: number;
          gas_station: string | null;
          full_tank: boolean;
          payment_method: "dinheiro" | "cartao" | "pix" | "boleto" | "outro" | null;
          driver_name: string | null;
          created_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          refuel_date?: string;
          engine_hours?: number | null;
          fuel_type?: string;
          liters: number;
          price_per_liter?: number | null;
          total_value: number;
          gas_station?: string | null;
          full_tank?: boolean;
          payment_method?: "dinheiro" | "cartao" | "pix" | "boleto" | "outro" | null;
          driver_name?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          refuel_date?: string;
          engine_hours?: number | null;
          fuel_type?: string;
          liters?: number;
          price_per_liter?: number | null;
          total_value?: number;
          gas_station?: string | null;
          full_tank?: boolean;
          payment_method?: "dinheiro" | "cartao" | "pix" | "boleto" | "outro" | null;
          driver_name?: string | null;
          created_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          owner_type: "refuel" | "maintenance_event" | "vehicle";
          owner_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_type: "refuel" | "maintenance_event" | "vehicle";
          owner_id: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_type?: "refuel" | "maintenance_event" | "vehicle";
          owner_id?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
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
      battery_reading_source: "manual" | "motorlog_api";
      alert_type: "battery_low" | "revision_due" | "revision_overdue";
      alert_severity: "info" | "warning" | "critical";
      alert_status: "open" | "acknowledged" | "resolved";
      maintenance_event_type: "revisao" | "troca_peca" | "troca_bateria" | "outro";
      payment_method: "dinheiro" | "cartao" | "pix" | "boleto" | "outro";
      attachment_owner_type: "refuel" | "maintenance_event" | "vehicle";
    };
    CompositeTypes: Record<string, never>;
  };
}
