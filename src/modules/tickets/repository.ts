import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/supabase/client";
import { TICKET_COLUMNS, mapTicketRow } from "./mappers";
import { TICKET_PAGE_SIZE } from "@/config/constants";
import type { CreateTicketInput } from "./schemas";
import type { Ticket, TicketCursor, TicketPage } from "./interfaces";

export async function listTickets(
  client: AppSupabaseClient,
  cursor: TicketCursor | null,
  customerId?: string | undefined
): Promise<TicketPage> {
  let query = client
    .from("tickets")
    .select(TICKET_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(TICKET_PAGE_SIZE);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const tickets = (data ?? []).map(mapTicketRow);
  const nextCursor =
    tickets.length === TICKET_PAGE_SIZE
      ? {
          createdAt: tickets[tickets.length - 1]!.createdAt,
          id: tickets[tickets.length - 1]!.id,
        }
      : null;

  return { tickets, nextCursor };
}

export async function insertTicket(
  client: AppSupabaseClient,
  input: CreateTicketInput & { customerId: string }
): Promise<{ ticket: Ticket | null; isDuplicate: boolean }> {
  const { data, error } = await client
    .from("tickets")
    .insert({
      customer_id: input.customerId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      idempotency_key: input.idempotencyKey,
    })
    .select(TICKET_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await findByIdempotencyKey(
        client,
        input.customerId,
        input.idempotencyKey
      );
      return { ticket: existing, isDuplicate: true };
    }
    throw error;
  }

  return { ticket: data ? mapTicketRow(data) : null, isDuplicate: false };
}

async function findByIdempotencyKey(
  client: AppSupabaseClient,
  customerId: string,
  idempotencyKey: string
): Promise<Ticket | null> {
  const { data } = await client
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("customer_id", customerId)
    .eq("idempotency_key", idempotencyKey)
    .single();

  return data ? mapTicketRow(data) : null;
}

export async function updateTicketStatus(
  client: AppSupabaseClient,
  id: string,
  status: Database["public"]["Enums"]["ticket_status"]
): Promise<Ticket> {
  const { data, error } = await client
    .from("tickets")
    .update({ status })
    .eq("id", id)
    .select(TICKET_COLUMNS)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Ticket not found");
  return mapTicketRow(data);
}
