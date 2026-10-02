import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { TicketPriority, TicketStatus } from "@/lib/supabase/database.types";
import type { TicketStats } from "./interfaces";

export async function fetchStats(client: AppSupabaseClient): Promise<TicketStats> {
  const { data, error } = await client.rpc("ticket_stats");
  if (error) throw error;

  const rows = (data as Array<{ status: TicketStatus; priority: TicketPriority; count: number }> | null) ?? [];

  return {
    rows: rows.map((r) => ({
      status: r.status,
      priority: r.priority,
      count: Number(r.count),
    })),
  };
}
