"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, type OrderDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  shipped: { label: "تم الشحن", cls: "bg-info-soft text-info" },
  processing: { label: "قيد التجهيز", cls: "bg-warn-soft text-warn" },
  delivered: { label: "تم التسليم", cls: "bg-success-soft text-success" },
  cancelled: { label: "ملغى", cls: "bg-danger-soft text-danger" },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { merchantId, users } = useAuth();
  const [data, setData] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    api.getOrder(id).then(setData).catch(console.error);
  }, [id, merchantId]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-ink-subtle">
        جاري التحميل...
      </div>
    );
  }

  const { order, tasks, conversations, timeline } = data;
  const status = STATUS_LABEL[order.status] ?? {
    label: order.status,
    cls: "bg-surface-3 text-ink-muted",
  };
  const totalSar = Math.round((order.totalAmount ?? 0) / 100);
  const products = ((order as any).rawPayload?.products as string[] | undefined) ?? [];

  return (
    <div className="px-10 py-12 max-w-4xl">
      <Link href="/dashboard/orders" className="text-sm text-ink-muted hover:text-ink mb-3 inline-block">
        ← العودة للطلبات
      </Link>

      <header className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-sm text-ink-subtle mb-1">طلب سلة</p>
          <h1 className="text-3xl font-semibold tracking-tight font-mono">
            #{order.sallaOrderId}
          </h1>
          <p className="text-ink-muted mt-1">{order.customerPhone ?? "—"}</p>
        </div>
        <div className="text-left">
          <div className="text-3xl font-semibold tracking-tight">
            {totalSar.toLocaleString("ar-SA")}{" "}
            <span className="text-base text-ink-subtle font-normal">{order.currency}</span>
          </div>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>
      </header>

      <section className="bg-surface rounded-2xl border border-line p-6 mb-5">
        <h3 className="font-semibold mb-4 tracking-tight">سير حالة الطلب</h3>
        <ol className="space-y-4">
          {timeline.map((t, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                  t.status === "done"
                    ? "bg-success"
                    : t.status === "active"
                      ? "bg-accent ring-4 ring-accent-soft"
                      : "bg-surface-3"
                }`}
              />
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    t.status === "pending" ? "text-ink-subtle" : "text-ink font-medium"
                  }`}
                >
                  {t.label}
                </div>
                {t.status !== "pending" && (
                  <div className="text-xs text-ink-subtle mt-0.5">
                    {new Date(t.at).toLocaleString("ar-SA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <section className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold mb-3 tracking-tight">
            المنتجات ({products.length})
          </h3>
          {products.length === 0 ? (
            <div className="text-sm text-ink-subtle">
              تفاصيل المنتجات غير متاحة في البيانات التجريبية.
            </div>
          ) : (
            <ul className="text-sm space-y-2">
              {products.map((p, i) => (
                <li key={i} className="flex items-center justify-between border-b border-line/60 last:border-b-0 pb-2 last:pb-0">
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface rounded-2xl border border-line p-6">
          <h3 className="font-semibold mb-3 tracking-tight">إجراءات سريعة</h3>
          <div className="space-y-2">
            {order.customerPhone && conversations[0] && (
              <Link
                href={`/dashboard/inbox`}
                className="block w-full text-right px-3 py-2 rounded-lg bg-canvas border border-line text-sm hover:border-accent hover:bg-accent-soft/30 transition"
              >
                💬 افتح محادثة العميل في الإنبوكس
              </Link>
            )}
            <button className="block w-full text-right px-3 py-2 rounded-lg bg-canvas border border-line text-sm hover:border-accent hover:bg-accent-soft/30 transition">
              📋 إنشاء مهمة لهذا الطلب
            </button>
            <button className="block w-full text-right px-3 py-2 rounded-lg bg-canvas border border-line text-sm hover:border-accent hover:bg-accent-soft/30 transition">
              ✨ صياغة رسالة شكر AI
            </button>
            <button className="block w-full text-right px-3 py-2 rounded-lg bg-canvas border border-line text-sm hover:border-accent hover:bg-accent-soft/30 transition">
              📞 اتصال صوتي بالعميل
            </button>
          </div>
        </section>
      </div>

      <section className="bg-surface rounded-2xl border border-line p-6 mb-5">
        <h3 className="font-semibold mb-3 tracking-tight">المهام المرتبطة ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <div className="text-sm text-ink-subtle">لا توجد مهام مرتبطة بهذا الطلب.</div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => {
              const assignee = users.find((u) => u.id === t.assignedUserId);
              return (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-2/40 border border-line/60"
                >
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    {assignee && (
                      <div className="text-xs text-ink-subtle mt-0.5">
                        {assignee.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      t.status === "done"
                        ? "bg-success-soft text-success"
                        : t.status === "in_progress"
                          ? "bg-warn-soft text-warn"
                          : "bg-surface-3 text-ink-subtle"
                    }`}
                  >
                    {t.status === "done" ? "منجز" : t.status === "in_progress" ? "جاري" : "للتنفيذ"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-surface rounded-2xl border border-line p-6">
        <h3 className="font-semibold mb-3 tracking-tight">
          محادثات نفس العميل ({conversations.length})
        </h3>
        {conversations.length === 0 ? (
          <div className="text-sm text-ink-subtle">
            لا توجد محادثات لهذا الرقم بعد.
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((c) => (
              <li
                key={c.id}
                className="p-3 rounded-lg bg-surface-2/40 border border-line/60 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium">
                    {c.customerName ?? c.customerPhone}
                  </div>
                  <div className="text-xs text-ink-subtle mt-0.5">
                    آخر نشاط: {new Date(c.lastMessageAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    c.status === "open" ? "bg-success-soft text-success" : "bg-surface-3 text-ink-subtle"
                  }`}
                >
                  {c.status === "open" ? "مفتوحة" : "مغلقة"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
