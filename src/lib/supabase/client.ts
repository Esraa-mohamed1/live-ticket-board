import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "./database.types";

export type AppSupabaseClient = SupabaseClient<
  Database,
  "public",
  "public",
  Database["public"]
>;

export function createClient(): AppSupabaseClient {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as unknown as AppSupabaseClient;
}
