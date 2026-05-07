"use client";

import { useCallback, useEffect, useState } from "react";
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
  "workflow.created": { ar: "أنشأ أتمتة جديدة", emoji: "🔧" },
  "customer.note_added": { ar: "أضاف ملاحظة عميل", emoji: "📝" },
  "api_key.created": { ar: "ولّد مفتاح API", emoji: "🔑" },
};

export default function ActivityPage() {
  const { merchantId, users } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [distinctActions, setDistinctActions] = useState<string[]>([]);
  const [filterActor, setFilterActor] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.listActivity({
        actor: filterActor || undefined,
        action: filterAction || undefined,
        from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
        to: filterTo ? new Date(filterTo).toISOString() : undefined,
      });
      setEntries(r.entries);
      setDistinctActions(r.distinctActions);
    } finally {
      setLoading(false);
    }
  }, [filterActor, filterAction, filterFrom, filterTo]);

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId, load]);

  function reset() {
    setFilterActor("");
    setFilterAction("");
    setFilterFrom("");
    setFilterTo("");
  }

  const exportUrl = api.exportActivityUrl({
    actor: filterActor || undefined,
    action: filterAction || undefined,
    from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
    to: filterTo ? new Date(filterTo).toISOString() : undefined,
  });

  const hasFilters = !!(filterActor || filterAction || filterFrom || filterTo);

  return (
    <div className="px-10 py-12 max-w-4xl">
      <header className="mb-6">
        <p className="text-sm text-ink-subtle mb-1">سجل النشاط</p>
        <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          آخر ما حصل في حسابك. فلتر حسب الموظف، الحدث، والتاريخ — وصدّر الناتج CSV.
        </p>
      </header>

      <div className="bg-surface rounded-2xl border border-line p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <Field label="الموظف">
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="">الجميع</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>
          <Field label="نوع الحدث">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="">كل الأحداث</option>
              {distinctActions.map((a) => (
                <option key={a} value={a}>{ACTION_LABEL[a]?.ar ?? a}</option>
              ))}
            </select>
          </Field>
          <Field label="من تاريخ">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </Field>
          <Field label="إلى تاريخ">
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-subtle">
            {loading ? "جاري التحميل..." : `${entries.length} حدث ${hasFilters ? "(مفلتر)" : ""}`}
          </span>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={reset}
                className="text-xs text-ink-muted hover:text-ink"
              >
                إعادة ضبط
              </button>
            )}
            <a
              href={exportUrl}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-soft text-accent-ink hover:bg-accent-soft-hover"
            >
              ⬇ تصدير CSV
            </a>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line">
        <ul>
          {entries.length === 0 && (
            <li className="text-center text-ink-subtle py-12 text-sm">
              لا توجد أحداث {hasFilters ? "تطابق هذا الفلتر" : "بعد"}
            </li>
          )}
          {entries.map((e) => {
            const actor = users.find((u) => u.id === e.actorUserId);
            const label = ACTION_LABEL[e.action] ?? { ar: e.action, emoji: "•" };
            const meta = e.metadata as Record<string, unknown> | null;
            return (
              <li
                key={e.id}
                className="px-5 py-3.5 border-b border-line/60 last:border-b-0 flex items-start gap-3"
              >
                <div className="text-lg shrink-0 leading-none mt-0.5">{label.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{actor?.name ?? "النظام"}</span>{" "}
                    <span className="text-ink-muted">{label.ar}</span>
                    {meta && (meta as any).title && (
                      <span className="text-ink-muted">: <span className="text-ink">{String((meta as any).title)}</span></span>
                    )}
                    {meta && (meta as any).slug && (
                      <span className="text-ink-muted">: <code className="font-mono text-xs">{String((meta as any).slug)}</code></span>
                    )}
                    {meta && (meta as any).name && (
                      <span className="text-ink-muted">: "<span className="text-ink">{String((meta as any).name)}</span>"</span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-ink-subtle">{label}</span>
      {children}
    </label>
  );
}
