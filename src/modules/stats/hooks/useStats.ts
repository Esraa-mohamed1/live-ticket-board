"use client";

import { useEffect, useState } from "react";
import type { TicketStats, UseStatsReturn } from "@/modules/stats/interfaces";

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = (await res.json()) as TicketStats;
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return { stats, loading, error };
}
