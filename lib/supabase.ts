"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * Uses the **anon key** only — safe to ship to the browser. Row Level
 * Security policies on each Supabase table decide what the anon role can read.
 *
 * Optional: returns null if env vars aren't configured. The current dashboard
 * works fine without Supabase (Drizzle/Hono backend handles everything via
 * /api). This client is here for future Realtime subscriptions, e.g.:
 *
 *   supabase
 *     .channel("messages")
 *     .on("postgres_changes",
 *       { event: "INSERT", schema: "public", table: "messages" },
 *       (payload) => { ... })
 *     .subscribe();
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !anonKey) return null;
  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: { eventsPerSecond: 5 },
    },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(url && anonKey);
}
