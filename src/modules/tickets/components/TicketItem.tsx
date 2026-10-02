import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { StatusSelect } from "./StatusSelect";
import type { TicketItemProps } from "@/modules/tickets/interfaces";

export function TicketItem({ ticket, isAgent, customerView }: TicketItemProps) {
  const canEditStatus = isAgent && !customerView;
  const createdAt = new Date(ticket.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const customerName =
    ticket.customerId === "00000000-0000-4000-8000-000000000001"
      ? "Acme Corp (Customer 1)"
      : ticket.customerId === "00000000-0000-4000-8000-000000000002"
      ? "Beta Labs (Customer 2)"
      : `Customer ${ticket.customerId.slice(0, 8)}`;

  return (
    <article className="ticket-item" aria-label={`Ticket: ${ticket.title}`}>
      <div className="ticket-header">
        <div className="ticket-meta">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          {isAgent && !customerView && (
            <span className="ticket-customer-tag" title={`Customer ID: ${ticket.customerId}`}>
              {customerName}
            </span>
          )}
        </div>
        <time className="ticket-time" dateTime={ticket.createdAt}>
          {createdAt}
        </time>
      </div>
      <h3 className="ticket-title">{ticket.title}</h3>
      <p className="ticket-description">{ticket.description}</p>
      {canEditStatus && (
        <div className="ticket-actions">
          <StatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      )}
    </article>
  );
}
