import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import type { Database } from "./database.types";
import type { AppSupabaseClient } from "./client";

interface CookieToSet {
  name: string;
  value: string;
  options?: CookieOptions;
}

export async function createClient(): Promise<AppSupabaseClient> {
  const cookieStore = await cookies();
  const client = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) {
                cookieStore.set(name, value, options);
              } else {
                cookieStore.set(name, value);
              }
            });
          } catch {
            // Server components cannot set cookies; middleware handles refresh
          }
        },
      },
    }
  );

  return client as unknown as AppSupabaseClient;
}
