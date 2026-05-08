"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type AppNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeTable } from "@/lib/realtime";

const KIND_EMOJI: Record<string, string> = {
  "task.assigned": "📋",
  "cart.recovered": "🛒",
  "mention": "@",
  "conversation.unassigned": "💬",
  "ai.complaint_detected": "⚠️",
};

export function NotificationsBell() {
  const { merchantId } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await api.listNotifications();
    setItems(r.notifications);
    setUnread(r.unreadCount);
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
    // Polling fallback every 60s — Realtime hook below handles instant updates
    // when Supabase Realtime is configured + replication is enabled.
    const t = setInterval(() => void load().catch(console.error), 60000);
    return () => clearInterval(t);
  }, [merchantId, load]);

  // Live: instant updates on new notifications for this merchant
  useRealtimeTable<Record<string, unknown>>({
    table: "notifications",
    event: "INSERT",
    filter: merchantId ? `merchant_id=eq.${merchantId}` : undefined,
    enabled: !!merchantId,
    onChange: () => {
      load().catch(console.error);
    },
  });

  // Click outside closes drawer
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  async function handleClick(n: AppNotification) {
    if (!n.readAt) {
      await api.markNotificationRead(n.id);
      await load();
    }
    if (n.href) window.location.href = n.href;
    setOpen(false);
  }

  async function markAllRead() {
    await api.markAllNotificationsRead();
    await load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-surface-2 transition"
        aria-label="الإشعارات"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ink-muted">
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-medium flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-surface rounded-2xl border border-line shadow-lg z-50 max-h-[480px] flex flex-col">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <span className="font-semibold tracking-tight text-sm">الإشعارات</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-accent hover:underline"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center text-ink-subtle py-8 text-sm">
                لا توجد إشعارات
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-right px-4 py-3 border-b border-line/60 last:border-b-0 hover:bg-surface-2 transition flex items-start gap-3 ${
                        !n.readAt ? "bg-accent-soft/30" : ""
                      }`}
                    >
                      <div className="text-lg shrink-0 mt-0.5">
                        {KIND_EMOJI[n.kind] ?? "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">
                          {n.title}
                          {!n.readAt && (
                            <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5 align-middle" />
                          )}
                        </div>
                        {n.body && (
                          <div className="text-xs text-ink-muted leading-6 mt-0.5 line-clamp-2">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[11px] text-ink-subtle mt-1">
                          {new Date(n.createdAt).toLocaleString("ar-SA", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 py-2 border-t border-line text-center">
            <Link
              href="/dashboard/activity"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-muted hover:text-accent"
            >
              عرض كل النشاط ←
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
