import type { Ticket } from "@/modules/tickets/interfaces";

export function sortTickets(ticketMap: Map<string, Ticket>): Ticket[] {
  return Array.from(ticketMap.values()).sort((a, b) => {
    const timeDiff =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
}
