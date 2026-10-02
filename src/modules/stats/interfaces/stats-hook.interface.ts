import type { TicketStats } from "./stats.interface";

export interface UseStatsReturn {
  stats: TicketStats | null;
  loading: boolean;
  error: string | null;
}
