"use client";

import { useEffect, useState } from "react";
import { api, type WorkflowTemplate } from "@/lib/api";
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
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const isOwner = currentUser?.role === "owner";

  async function load() {
    const r = await api.listWorkflows();
    setWorkflows(r.workflows);
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

  return (
    <div className="px-10 py-12 max-w-4xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">الأتمتة</p>
        <h1 className="text-3xl font-semibold tracking-tight">الأتمتات</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          قوالب جاهزة تشتغل تلقائياً. {workflows.filter((w) => w.enabled).length} مفعّلة من {workflows.length}.
          {!isOwner && " (التفعيل/التوقيف متاح للمالك فقط)"}
        </p>
      </header>

      <div className="space-y-3">
        {workflows.map((w) => (
          <div
            key={w.id}
            className="bg-surface border border-line rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{w.name}</h3>
                  {w.enabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success">
                      مفعّل
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-muted leading-7 mb-3">
                  {w.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line/60">
                  <div className="text-xs">
                    <span className="text-ink-subtle">عند: </span>
                    <span className="text-ink">
                      {TRIGGER_LABEL[w.trigger] ?? w.trigger}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-ink-subtle">يقوم بـ: </span>
                    <span className="text-ink">
                      {ACTION_LABEL[w.action] ?? w.action}
                    </span>
                  </div>
                </div>
              </div>
              <Toggle enabled={w.enabled} disabled={!isOwner} onChange={() => toggle(w)} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-2xl bg-surface-2/40 border border-dashed border-line text-sm text-ink-muted leading-7">
        💡 <strong className="text-ink">قريباً:</strong> محرر بصري لإنشاء أتمتات
        مخصصة (Drag & drop) — يربط أحداث سلة، رسائل واتساب، AI، ومهام Anvira في
        تدفقات أنت تصممها بنفسك.
      </div>
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
