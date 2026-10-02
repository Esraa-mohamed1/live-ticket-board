import { z } from "zod";
import { TICKET_STATUSES } from "@/modules/tickets/constants";

export const updateStatusSchema = z.object({
  id: z.string().uuid("Ticket ID must be a valid UUID"),
  status: z.enum(TICKET_STATUSES, {
    errorMap: () => ({
      message: "Status must be open, in_progress, or resolved",
    }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
