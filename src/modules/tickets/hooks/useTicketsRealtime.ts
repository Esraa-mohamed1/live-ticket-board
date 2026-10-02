"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { listTicketsAction } from "@/modules/tickets/actions";
import { mergeTickets } from "@/modules/tickets/utils/merge-ticket";
import { sortTickets } from "@/modules/tickets/utils/sort-tickets";
import { mapTicketRow } from "@/modules/tickets/mappers";
import type {
  Ticket,
  TicketCursor,
  RealtimeStatus,
  UseTicketsRealtimeOptions,
  UseTicketsRealtimeReturn,
} from "@/modules/tickets/interfaces";
import type { Database } from "@/lib/supabase/database.types";

export function useTicketsRealtime(
  options: UseTicketsRealtimeOptions = {}
): UseTicketsRealtimeReturn {
  const { customerId } = options;
  const [ticketMap, setTicketMap] = useState<Map<string, Ticket>>(new Map());
  const [nextCursor, setNextCursor] = useState<TicketCursor | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [loadingMore, setLoadingMore] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchFirstPage = useCallback(async () => {
    const result = await listTicketsAction(null, customerId);
    if (!result.ok) return;
    const map = new Map(result.data.tickets.map((t) => [t.id, t]));
    setTicketMap(map);
    setNextCursor(result.data.nextCursor);
  }, [customerId]);

  useEffect(() => {
    void fetchFirstPage();

    const supabase = createClient();

    const channel = supabase
      .channel(`tickets-realtime-${customerId ?? "all"}`)
      .on<Database["public"]["Tables"]["tickets"]["Row"]>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => {
          const ticket = mapTicketRow(payload.new);
          if (customerId && ticket.customerId !== customerId) return;
          setTicketMap((prev) => mergeTickets(prev, ticket));
        }
      )
      .on<Database["public"]["Tables"]["tickets"]["Row"]>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        (payload) => {
          const ticket = mapTicketRow(payload.new);
          if (customerId && ticket.customerId !== customerId) return;
          setTicketMap((prev) => mergeTickets(prev, ticket));
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("live");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          setStatus("offline");
          void fetchFirstPage();
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchFirstPage, customerId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await listTicketsAction(nextCursor, customerId);
    if (result.ok) {
      setTicketMap((prev) => {
        const next = new Map(prev);
        for (const t of result.data.tickets) next.set(t.id, t);
        return next;
      });
      setNextCursor(result.data.nextCursor);
    }
    setLoadingMore(false);
  }, [nextCursor, loadingMore, customerId]);

  return {
    tickets: sortTickets(ticketMap),
    status,
    nextCursor,
    loadMore,
    loadingMore,
  };
}
