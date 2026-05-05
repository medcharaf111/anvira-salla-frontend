"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AbandonedCart } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CartsPage() {
  const { merchantId } = useAuth();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [lastDraft, setLastDraft] = useState<{ id: string; text: string } | null>(null);

  const load = useCallback(async () => {
    const r = await api.listCarts();
    setCarts(r.carts);
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId, load]);

  async function handleRecover(id: string) {
    setRecoveringId(id);
    try {
      const r = await api.recoverCart(id);
      setLastDraft({ id, text: r.draft });
      await load();
    } finally {
      setRecoveringId(null);
    }
  }

  return (
    <div className="px-8 py-10 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">السلات المهجورة</h1>
        <p className="text-zinc-500 text-sm">
          عملاء أضافوا منتجات للسلة ولم يكملوا الدفع. اضغط "استرجاع" ليصيغ الذكاء الاصطناعي رسالة واتساب مخصصة ويرسلها.
        </p>
      </div>

      <div className="space-y-3">
        {carts.length === 0 && (
          <div className="text-center text-zinc-400 py-12">لا توجد سلات</div>
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
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold">{cart.customerPhone}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    منذ {formatMinutes(minutesAgo)} · سلة #{cart.sallaCartId}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold">{totalSar.toLocaleString("ar-SA")} ر.س</div>
                  {sent ? (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      ✓ تم الإرسال
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      بانتظار الاسترجاع
                    </span>
                  )}
                </div>
              </div>

              {products.length > 0 && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  المنتجات: {products.join(" · ")}
                </div>
              )}

              {lastDraft?.id === cart.id && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-3 text-sm leading-7">
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold mb-2">
                    ✨ الرسالة التي صاغها Gemini وأُرسلت:
                  </div>
                  <div className="whitespace-pre-wrap">{lastDraft.text}</div>
                </div>
              )}

              <button
                onClick={() => handleRecover(cart.id)}
                disabled={recoveringId === cart.id}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {recoveringId === cart.id
                  ? "جاري صياغة الرسالة وإرسالها…"
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
