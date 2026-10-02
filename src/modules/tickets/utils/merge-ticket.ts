import type { Ticket } from "@/modules/tickets/interfaces";

export function mergeTickets(
  existing: Map<string, Ticket>,
  incoming: Ticket
): Map<string, Ticket> {
  const next = new Map(existing);
  next.set(incoming.id, incoming);
  return next;
}
