import { z } from "zod";
import { TICKET_PRIORITIES } from "@/modules/tickets/constants";

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .trim(),
  priority: z.enum(TICKET_PRIORITIES, {
    errorMap: () => ({ message: "Priority must be low, medium, or high" }),
  }),
  idempotencyKey: z.string().uuid("Must be a valid UUID"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
