"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AbandonedCart } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeTable } from "@/lib/realtime";

export default function CartsPage() {
  const { merchantId } = useAuth();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<{
    id: string;
    text: string;
    aiSource: "gemini" | "fallback";
  } | null>(null);

  const load = useCallback(async () => {
    const r = await api.listCarts();
    setCarts(r.carts);
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId, load]);

  // Live: any cart change for this merchant → reload list
  useRealtimeTable<Record<string, unknown>>({
    table: "abandoned_carts",
    filter: merchantId ? `merchant_id=eq.${merchantId}` : undefined,
    enabled: !!merchantId,
    onChange: () => {
      load().catch(console.error);
    },
  });

  const [simulating, setSimulating] = useState(false);
  async function handleSimulate() {
    setSimulating(true);
    try {
      await api.simulateAbandonedCart();
      await load();
    } finally {
      setSimulating(false);
    }
  }

  async function handleRecover(id: string) {
    setRecoveringId(id);
    try {
      const r = await api.recoverCart(id);
      setLastDraft({ id, text: r.draft, aiSource: r.aiSource });
      await load();
    } finally {
      setRecoveringId(null);
    }
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-subtle mb-1">الاستعادة الذكية</p>
          <h1 className="text-3xl font-semibold tracking-tight">السلات المهجورة</h1>
          <p className="text-ink-muted mt-2 text-[15px] max-w-2xl leading-relaxed">
            عملاء أضافوا منتجات للسلة ولم يكملوا الدفع. اضغط "استرجاع" ليصيغ Anvira AI رسالة واتساب مخصصة باسم العميل ومنتجاته، ويرسلها مباشرة.
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="text-xs px-3 py-1.5 rounded-lg bg-warn-soft text-warn hover:opacity-80 transition disabled:opacity-50 shrink-0"
          title="إنشاء سلة مهجورة وهمية للعرض"
        >
          {simulating ? "..." : "+ محاكاة سلة"}
        </button>
      </header>

      <div className="space-y-3">
        {carts.length === 0 && (
          <div className="text-center text-ink-subtle py-16 bg-surface border border-line rounded-2xl">
            لا توجد سلات
          </div>
        )}
        {carts.map((cart) => {
          const products = cart.rawPayload?.products ?? [];
          const minutesAgo = Math.round(
            (Date.now() - new Date(cart.createdAt).getTime()) / 60000
          );
          const totalSar = Math.round((cart.totalAmount ?? 0) / 100);
          const sent = !!cart.recoveryMessageSentAt;
          return (
            <div
              key={cart.id}
              className="bg-surface rounded-2xl border border-line p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold tracking-tight">
                    {cart.customerPhone}
                  </div>
                  <div className="text-xs text-ink-subtle mt-0.5">
                    منذ {formatMinutes(minutesAgo)} · سلة #{cart.sallaCartId}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-semibold tracking-tight">
                    {totalSar.toLocaleString("ar-SA")} <span className="text-sm text-ink-subtle font-normal">ر.س</span>
                  </div>
                  {sent ? (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success">
                      ✓ تم الإرسال
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-warn-soft text-warn">
                      بانتظار الاسترجاع
                    </span>
                  )}
                </div>
              </div>

              {products.length > 0 && (
                <div className="text-sm text-ink-muted mb-4 leading-7">
                  <span className="text-ink-subtle">المنتجات في السلة: </span>
                  {products.join(" · ")}
                </div>
              )}

              {lastDraft?.id === cart.id && (
                <div className="bg-accent-soft/60 border border-accent/15 rounded-xl p-4 mb-3 text-sm leading-7">
                  <div className="text-[11px] text-accent-ink font-medium mb-2 flex items-center gap-1.5">
                    <span>✨</span>
                    {lastDraft.aiSource === "gemini"
                      ? "الرسالة التي صاغها Anvira AI وأُرسلت:"
                      : "قالب احتياطي (AI غير متاح حالياً) — أُرسل:"}
                  </div>
                  <div className="whitespace-pre-wrap text-ink">
                    {lastDraft.text}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleRecover(cart.id)}
                disabled={recoveringId === cart.id}
                className="px-4 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover transition disabled:opacity-50 shadow-sm"
              >
                {recoveringId === cart.id
                  ? "جاري صياغة الرسالة..."
                  : sent
                  ? "إعادة إرسال"
                  : "صياغة وإرسال رسالة استرجاع"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعة`;
  return `${Math.floor(h / 24)} يوم`;
}
