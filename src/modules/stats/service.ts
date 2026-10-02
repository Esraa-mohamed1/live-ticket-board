import type { AppSupabaseClient } from "@/lib/supabase/client";
import { TTLCache } from "@/lib/cache/ttl-cache";
import { STATS_TTL_MS } from "@/config/constants";
import { fetchStats } from "./repository";
import type { TicketStats } from "./interfaces";

export const statsCache = new TTLCache<string, TicketStats>(STATS_TTL_MS);

export async function getStats(
  client: AppSupabaseClient,
  cacheKey: string
): Promise<TicketStats> {
  const cached = statsCache.get(cacheKey);
  if (cached) return cached;

  const stats = await fetchStats(client);
  statsCache.set(cacheKey, stats);
  return stats;
}
