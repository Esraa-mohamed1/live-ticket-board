export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type UserRole = "customer" | "agent";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          description: string;
          priority: TicketPriority;
          status: TicketStatus;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string;
          title: string;
          description: string;
          priority?: TicketPriority;
          status?: TicketStatus;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          title?: string;
          description?: string;
          priority?: TicketPriority;
          status?: TicketStatus;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ticket_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          status: TicketStatus;
          priority: TicketPriority;
          count: number;
        }[];
      };
      is_agent: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      ticket_priority: TicketPriority;
      ticket_status: TicketStatus;
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
