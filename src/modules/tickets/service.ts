import type { AppSupabaseClient } from "@/lib/supabase/client";
import { rateLimiter } from "@/lib/rate-limit";
import { mapPgError } from "@/lib/errors/map-pg-error";
import { statsCache } from "@/modules/stats/service";
import { AGENT_CACHE_KEY, customerCacheKey } from "@/modules/stats/cache-keys";
import { insertTicket, listTickets, updateTicketStatus } from "./repository";
import type { CreateTicketInput, UpdateStatusInput } from "./schemas";
import type { Ticket, TicketCursor, TicketPage } from "./interfaces";

export async function getTicketsPage(
  client: AppSupabaseClient,
  cursor: TicketCursor | null,
  customerId?: string | undefined
): Promise<TicketPage> {
  return listTickets(client, cursor, customerId);
}

export async function createTicket(
  client: AppSupabaseClient,
  userId: string,
  input: CreateTicketInput
): Promise<{ ticket: Ticket; isDuplicate: boolean }> {
  const limit = rateLimiter.check(userId);
  if (!limit.allowed) {
    const seconds = Math.ceil(limit.retryAfter / 1000);
    throw Object.assign(
      new Error(
        `Rate limit reached. Try again in ${seconds} second${seconds !== 1 ? "s" : ""}.`
      ),
      { code: "APP_RATE_LIMITED" }
    );
  }

  try {
    const result = await insertTicket(client, { ...input, customerId: userId });

    if (!result.isDuplicate) {
      statsCache.delete(AGENT_CACHE_KEY);
      statsCache.delete(customerCacheKey(userId));
    }

    if (!result.ticket) throw new Error("Ticket insert returned no data.");
    return { ticket: result.ticket, isDuplicate: result.isDuplicate };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "APP_RATE_LIMITED") {
      throw error;
    }
    throw mapPgError(error as { code?: string; message?: string });
  }
}

export async function changeTicketStatus(
  client: AppSupabaseClient,
  userId: string,
  input: UpdateStatusInput
): Promise<Ticket> {
  try {
    const ticket = await updateTicketStatus(client, input.id, input.status);
    statsCache.delete(AGENT_CACHE_KEY);
    statsCache.delete(customerCacheKey(userId));
    return ticket;
  } catch (error) {
    throw mapPgError(error as { code?: string; message?: string });
  }
}
