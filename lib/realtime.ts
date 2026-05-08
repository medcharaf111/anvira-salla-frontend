"use client";

import { useEffect, useRef } from "react";
import { type RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeTableOptions<T extends Record<string, unknown>> {
  table: string;
  event?: ChangeEvent;
  /** Optional Supabase Realtime filter, e.g. `"merchant_id=eq.<uuid>"` */
  filter?: string;
  /** Called for each change. Receives the full payload. */
  onChange: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** When changed, the subscription tears down and re-subscribes. */
  enabled?: boolean;
}

/**
 * Subscribe to Postgres changes on a single table via Supabase Realtime.
 *
 * Requires:
 *   1. NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY env vars set
 *   2. The table must have replication enabled in Supabase
 *      (Database → Replication → toggle table on the `supabase_realtime` publication)
 *
 * If Supabase isn't configured, this is a no-op — the dashboard still works
 * with manual refreshes (existing polling/refresh logic stays in place).
 */
export function useRealtimeTable<T extends Record<string, unknown>>(
  options: UseRealtimeTableOptions<T>
): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (options.enabled === false) return;
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channelName = `rt:${options.table}:${options.filter ?? "all"}:${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event: options.event ?? "*",
          schema: "public",
          table: options.table,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          // Always call the LATEST onChange (avoid stale closures)
          optsRef.current.onChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.table, options.event, options.filter, options.enabled]);
}
