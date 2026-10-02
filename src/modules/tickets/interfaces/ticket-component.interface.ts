import type { Ticket } from "./ticket.interface";
import type { TicketPriority, TicketStatus } from "@/lib/supabase/database.types";

export interface TicketItemProps {
  ticket: Ticket;
  isAgent: boolean;
  customerView: boolean;
}

export interface TicketListProps {
  isAgent: boolean;
  customerView: boolean;
  customerId?: string | undefined;
}

export interface TicketFormProps {
  customerId?: string | undefined;
  onTicketCreated?: (() => void) | undefined;
}

export interface StatusSelectProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

export interface PriorityBadgeProps {
  priority: TicketPriority;
}
