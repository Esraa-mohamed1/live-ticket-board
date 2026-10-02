import type { Ticket, TicketCursor } from "./ticket.interface";
import type { Result } from "@/lib/result";

export type RealtimeStatus = "connecting" | "live" | "offline";

export interface UseTicketsRealtimeOptions {
  customerId?: string | undefined;
}

export interface UseTicketsRealtimeReturn {
  tickets: Ticket[];
  status: RealtimeStatus;
  nextCursor: TicketCursor | null;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

export interface UseCreateTicketReturn {
  submit: (
    formData: FormData
  ) => Promise<Result<{ ticket: Ticket; isDuplicate: boolean }>>;
  pending: boolean;
}
