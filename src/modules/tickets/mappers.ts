import type { Database } from "@/lib/supabase/database.types";
import type { Ticket } from "./interfaces";

type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];

export const TICKET_COLUMNS =
  "id, customer_id, title, description, priority, status, idempotency_key, created_at, updated_at" as const;

export function mapTicketRow(row: TicketRow): Ticket {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
