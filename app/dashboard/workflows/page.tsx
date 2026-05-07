"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CustomWorkflow, type WorkflowTemplate } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const TRIGGER_LABEL: Record<string, string> = {
  "salla.abandoned_cart": "عند ترك سلة بدون إكمال",
  "salla.order_completed": "عند إتمام طلب",
  "calendar.upcoming_appointment": "قبل موعد بـ ٢٤ ساعة",
  "ai.complaint_detected": "عند رصد شكوى من العميل (AI)",
  "schedule.friday_morning": "كل جمعة صباحاً",
};

const ACTION_LABEL: Record<string, string> = {
  "whatsapp.send_recovery": "إرسال رسالة استرجاع AI على واتساب",
  "whatsapp.send_thanks": "إرسال رسالة شكر مع رابط التتبع",
  "whatsapp.send_reminder": "إرسال تذكير على واتساب",
  "tasks.create_for_owner": "إنشاء تاسك للمالك للمتابعة",
  "ai.weekly_summary": "تلخيص أسبوعي بالـ AI",
};

export default function WorkflowsPage() {
  const { merchantId, currentUser } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [custom, setCustom] = useState<CustomWorkflow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const isOwner = currentUser?.role === "owner";

  async function load() {
    const [t, c] = await Promise.all([
      api.listWorkflows(),
      api.listCustomWorkflows(),
    ]);
    setTemplates(t.workflows);
    setCustom(c.workflows);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  async function toggle(w: WorkflowTemplate) {
    if (!isOwner) return;
    await api.toggleWorkflow(w.id, !w.enabled);
    await load();
  }

  async function createNew() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await api.createCustomWorkflow({ name: newName.trim() });
      setNewName("");
      await load();
      // Navigate to builder
      window.location.href = `/dashboard/workflows/builder/${r.workflow.id}`;
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">الأتمتة</p>
        <h1 className="text-3xl font-semibold tracking-tight">الأتمتات</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          قوالب جاهزة + محرر بصري لبناء أتمتاتك المخصصة.
        </p>
      </header>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg tracking-tight">أتمتاتي المخصصة</h2>
          <span className="text-xs text-ink-subtle">
            {custom.length} أتمتة · {custom.filter((w) => w.enabled).length} مفعّلة
          </span>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 mb-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createNew()}
            placeholder="اسم الأتمتة الجديدة..."
            className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <button
            onClick={createNew}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
          >
            {creating ? "..." : "إنشاء + فتح المحرر"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {custom.map((w) => (
            <Link
              key={w.id}
              href={`/dashboard/workflows/builder/${w.id}`}
              className="block bg-surface border border-line rounded-2xl p-5 hover:border-accent transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{w.name}</h3>
                {w.enabled ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success">مفعّل</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-ink-subtle">معطل</span>
                )}
              </div>
              {w.description && (
                <p className="text-sm text-ink-muted leading-7 mb-3">{w.description}</p>
              )}
              <div className="text-xs text-ink-subtle">
                {w.nodes.length} عنصر · {w.edges.length} رابط · آخر تعديل {new Date(w.updatedAt).toLocaleDateString("ar-SA")}
              </div>
            </Link>
          ))}
          {custom.length === 0 && (
            <div className="col-span-full text-center text-ink-subtle py-8 bg-surface-2/40 rounded-2xl border border-dashed border-line">
              لا توجد أتمتات مخصصة بعد. أنشئ أول واحدة أعلاه.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg tracking-tight">قوالب جاهزة</h2>
          <span className="text-xs text-ink-subtle">
            {templates.filter((t) => t.enabled).length} مفعّلة من {templates.length}
            {!isOwner && " · للمالك التفعيل"}
          </span>
        </div>

        <div className="space-y-3">
          {templates.map((w) => (
            <div key={w.id} className="bg-surface border border-line rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{w.name}</h3>
                    {w.enabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success">مفعّل</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-muted leading-7 mb-3">{w.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line/60">
                    <div className="text-xs">
                      <span className="text-ink-subtle">عند: </span>
                      <span className="text-ink">{TRIGGER_LABEL[w.trigger] ?? w.trigger}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-ink-subtle">يقوم بـ: </span>
                      <span className="text-ink">{ACTION_LABEL[w.action] ?? w.action}</span>
                    </div>
                  </div>
                </div>
                <Toggle enabled={w.enabled} disabled={!isOwner} onChange={() => toggle(w)} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Toggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition shrink-0 relative ${
        enabled ? "bg-accent" : "bg-surface-3"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
          enabled ? "right-0.5" : "right-[1.625rem]"
        }`}
      />
    </button>
  );
}
