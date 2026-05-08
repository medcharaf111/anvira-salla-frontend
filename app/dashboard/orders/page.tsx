"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type SallaOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeTable } from "@/lib/realtime";

const STATUS: Record<string, { label: string; cls: string }> = {
  shipped: { label: "تم الشحن", cls: "bg-info-soft text-info" },
  processing: { label: "قيد التجهيز", cls: "bg-warn-soft text-warn" },
  delivered: { label: "تم التسليم", cls: "bg-success-soft text-success" },
  cancelled: { label: "ملغى", cls: "bg-danger-soft text-danger" },
};

export default function OrdersPage() {
  const { merchantId } = useAuth();
  const [orders, setOrders] = useState<SallaOrder[]>([]);
  const [simulating, setSimulating] = useState(false);

  async function load() {
    const r = await api.listOrders();
    setOrders(r.orders);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  // Live: order changes for this merchant → reload table
  useRealtimeTable<Record<string, unknown>>({
    table: "salla_orders",
    filter: merchantId ? `merchant_id=eq.${merchantId}` : undefined,
    enabled: !!merchantId,
    onChange: () => {
      load().catch(console.error);
    },
  });

  async function handleSimulate() {
    setSimulating(true);
    try {
      await api.simulateOrder();
      await load();
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="px-10 py-12 max-w-6xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-subtle mb-1">طلبات سلة</p>
          <h1 className="text-3xl font-semibold tracking-tight">الطلبات</h1>
          <p className="text-ink-muted mt-2 text-[15px]">
            مرآة لطلبات المتجر القادمة من سلة (Webhook في الإصدار الفعلي).
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="text-xs px-3 py-1.5 rounded-lg bg-warn-soft text-warn hover:opacity-80 transition disabled:opacity-50 shrink-0"
          title="إنشاء طلب وهمي للعرض"
        >
          {simulating ? "..." : "+ محاكاة طلب"}
        </button>
      </header>

      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2/60 text-ink-subtle">
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                رقم الطلب
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                العميل
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                الحالة
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                المبلغ
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                التاريخ
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-ink-subtle py-12">
                  لا توجد طلبات
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const status = STATUS[o.status] ?? {
                label: o.status,
                cls: "bg-surface-3 text-ink-muted",
              };
              const totalSar = Math.round((o.totalAmount ?? 0) / 100);
              return (
                <tr
                  key={o.id}
                  className="border-t border-line/60 hover:bg-canvas/50 transition cursor-pointer"
                  onClick={() => { window.location.href = `/dashboard/orders/${o.id}`; }}
                >
                  <td className="px-5 py-3.5 font-medium font-mono text-[13px]">
                    <Link href={`/dashboard/orders/${o.id}`} className="text-accent hover:underline">
                      #{o.sallaOrderId}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted text-[13px]">
                    {o.customerPhone ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium">
                    {totalSar.toLocaleString("ar-SA")}{" "}
                    <span className="text-ink-subtle text-xs font-normal">
                      {o.currency}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-subtle text-xs">
                    {new Date(o.createdAt).toLocaleString("ar-SA", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
