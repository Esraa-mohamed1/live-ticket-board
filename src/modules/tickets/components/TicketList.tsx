"use client";

import { useTicketsRealtime } from "@/modules/tickets/hooks/useTicketsRealtime";
import { TicketItem } from "./TicketItem";
import { Spinner } from "@/shared/components/ui/Spinner";
import { Button } from "@/shared/components/ui/Button";
import type { TicketListProps } from "@/modules/tickets/interfaces";

export function TicketList({
  isAgent,
  customerView,
  customerId,
}: TicketListProps) {
  const activeCustomerId = customerView ? customerId : undefined;
  const { tickets, status, nextCursor, loadMore, loadingMore } =
    useTicketsRealtime({ customerId: activeCustomerId });

  return (
    <section aria-label="Tickets" className="ticket-list-section">
      <div className="list-header">
        <div className="list-header-left">
          <h2 className="section-title">Tickets</h2>
          <span className="ticket-count-badge">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
        </div>
        <div className="connection-indicator" title={`Realtime: ${status}`}>
          <span className={`connection-dot connection-${status}`} />
          <span className="connection-label">{status}</span>
        </div>
      </div>

      {tickets.length === 0 && status !== "connecting" && (
        <div className="empty-state">
          <p>No tickets found in this view.</p>
        </div>
      )}

      {tickets.length === 0 && status === "connecting" && (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      )}

      <ul className="ticket-list" role="list">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <TicketItem
              ticket={ticket}
              isAgent={isAgent}
              customerView={customerView}
            />
          </li>
        ))}
      </ul>

      {nextCursor && (
        <div className="load-more">
          <Button
            id="load-more-btn"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            variant="ghost"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </section>
  );
}
