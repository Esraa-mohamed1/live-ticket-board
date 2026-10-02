import type { TicketPriority, TicketStatus } from "@/lib/supabase/database.types";

export interface StatRow {
  status: TicketStatus;
  priority: TicketPriority;
  count: number;
}

export interface TicketStats {
  rows: StatRow[];
}
