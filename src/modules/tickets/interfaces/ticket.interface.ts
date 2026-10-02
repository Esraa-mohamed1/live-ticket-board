import type { TicketPriority, TicketStatus } from "@/lib/supabase/database.types";

export interface Ticket {
  id: string;
  customerId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCursor {
  createdAt: string;
  id: string;
}

export interface TicketPage {
  tickets: Ticket[];
  nextCursor: TicketCursor | null;
}
