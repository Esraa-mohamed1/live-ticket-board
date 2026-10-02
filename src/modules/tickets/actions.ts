"use server";

import { createClient } from "@/lib/supabase/server";
import { createTicketSchema, updateStatusSchema } from "./schemas";
import { createTicket, changeTicketStatus, getTicketsPage } from "./service";
import { mapZodError } from "@/lib/errors/map-zod-error";
import { ok, err } from "@/lib/result";
import { AppError } from "@/lib/errors/app-error";
import type { Result } from "@/lib/result";
import type { Ticket, TicketCursor, TicketPage } from "@/modules/tickets/interfaces";

const DEMO_CUSTOMER_ID = "00000000-0000-4000-8000-000000000001";

export async function createTicketAction(
  formData: FormData
): Promise<Result<{ ticket: Ticket; isDuplicate: boolean }>> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    idempotencyKey: formData.get("idempotencyKey"),
  };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return err("Validation failed.", mapZodError(parsed.error));
  }

  const supabase = await createClient();
  const customerId =
    typeof formData.get("customerId") === "string" && formData.get("customerId")
      ? (formData.get("customerId") as string)
      : DEMO_CUSTOMER_ID;

  try {
    const result = await createTicket(supabase, customerId, parsed.data);
    return ok(result);
  } catch (error) {
    const msg =
      error instanceof AppError || error instanceof Error
        ? error.message
        : "An unexpected error occurred.";
    return err(msg);
  }
}

export async function updateStatusAction(
  formData: FormData
): Promise<Result<Ticket>> {
  const raw = {
    id: formData.get("id"),
    status: formData.get("status"),
  };

  const parsed = updateStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return err("Validation failed.", mapZodError(parsed.error));
  }

  const supabase = await createClient();
  const actorId = "agent-system";

  try {
    const ticket = await changeTicketStatus(supabase, actorId, parsed.data);
    return ok(ticket);
  } catch (error) {
    const msg =
      error instanceof AppError || error instanceof Error
        ? error.message
        : "An unexpected error occurred.";
    return err(msg);
  }
}

export async function listTicketsAction(
  cursor: TicketCursor | null,
  customerId?: string
): Promise<Result<TicketPage>> {
  const supabase = await createClient();

  try {
    const page = await getTicketsPage(supabase, cursor, customerId);
    return ok(page);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to load tickets.";
    return err(msg);
  }
}
