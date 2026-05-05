"use client";

import { useEffect, useState } from "react";
import { api, type ActivityEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const ACTION_LABEL: Record<string, { ar: string; emoji: string }> = {
  "merchant.installed": { ar: "ثبّت Anvira", emoji: "🚀" },
  "user.invited": { ar: "أضاف موظفاً", emoji: "👤" },
  "conversation.replied": { ar: "ردّ على محادثة", emoji: "💬" },
  "cart.recovered": { ar: "أرسل رسالة استرجاع سلة", emoji: "🛒" },
  "task.created": { ar: "أنشأ مهمة", emoji: "📋" },
  "task.completed": { ar: "أنجز مهمة", emoji: "✓" },
  "workflow.enabled": { ar: "فعّل أتمتة", emoji: "⚙️" },
  "workflow.disabled": { ar: "أوقف أتمتة", emoji: "⏸️" },
  "customer.note_added": { ar: "أضاف ملاحظة عميل", emoji: "📝" },
};

export default function ActivityPage() {
  const { merchantId, users } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!merchantId) return;
    api.listActivity().then((r) => setEntries(r.entries)).catch(console.error);
  }, [merchantId]);

  return (
    <div className="px-10 py-12 max-w-3xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">سجل النشاط</p>
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          آخر ما حصل في حسابك: من فعل ماذا، ومتى.
        </p>
      </header>

      <div className="bg-surface rounded-2xl border border-line">
        <ul>
          {entries.length === 0 && (
            <li className="text-center text-ink-subtle py-12 text-sm">
              لا توجد أحداث بعد
            </li>
          )}
          {entries.map((e) => {
            const actor = users.find((u) => u.id === e.actorUserId);
            const label = ACTION_LABEL[e.action] ?? {
              ar: e.action,
              emoji: "•",
            };
            const meta = e.metadata as Record<string, unknown> | null;
            return (
              <li
                key={e.id}
                className="px-5 py-3.5 border-b border-line/60 last:border-b-0 flex items-start gap-3"
              >
                <div className="text-lg shrink-0 leading-none mt-0.5">
                  {label.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{actor?.name ?? "النظام"}</span>{" "}
                    <span className="text-ink-muted">{label.ar}</span>
                    {meta && (meta as any).title && (
                      <span className="text-ink-muted">
                        : "<span className="text-ink">{String((meta as any).title)}</span>"
                      </span>
                    )}
                    {meta && (meta as any).slug && (
                      <span className="text-ink-muted">
                        : <code className="font-mono text-xs">{String((meta as any).slug)}</code>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-subtle mt-0.5">
                    {new Date(e.createdAt).toLocaleString("ar-SA", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
