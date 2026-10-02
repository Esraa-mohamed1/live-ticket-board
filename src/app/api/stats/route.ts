import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStats } from "@/modules/stats/service";
import { AGENT_CACHE_KEY, customerCacheKey } from "@/modules/stats/cache-keys";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const role = url.searchParams.get("role") ?? "agent";
    const customerId = url.searchParams.get("customerId");

    const cacheKey =
      role === "customer" && customerId
        ? customerCacheKey(customerId)
        : AGENT_CACHE_KEY;

    const stats = await getStats(supabase, cacheKey);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
