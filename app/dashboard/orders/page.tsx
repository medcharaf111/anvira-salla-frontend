"use client";

import { useEffect, useState } from "react";
import { api, type SallaOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  shipped: { label: "تم الشحن", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  processing: { label: "قيد التجهيز", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  cancelled: { label: "ملغى", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export default function OrdersPage() {
  const { merchantId } = useAuth();
  const [orders, setOrders] = useState<SallaOrder[]>([]);

  useEffect(() => {
    if (!merchantId) return;
    api.listOrders().then((r) => setOrders(r.orders)).catch(console.error);
  }, [merchantId]);

  return (
    <div className="px-8 py-10 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">الطلبات</h1>
      <p className="text-zinc-500 text-sm mb-6">
        مرآة لطلبات المتجر القادمة من سلة (في الإصدار الحقيقي عبر Webhook).
      </p>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
              <th className="text-right px-5 py-3 font-medium">رقم الطلب</th>
              <th className="text-right px-5 py-3 font-medium">العميل</th>
              <th className="text-right px-5 py-3 font-medium">الحالة</th>
              <th className="text-right px-5 py-3 font-medium">المبلغ</th>
              <th className="text-right px-5 py-3 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-zinc-400 py-8">
                  لا توجد طلبات
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const status = STATUS_LABEL[o.status] ?? {
                label: o.status,
                color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800",
              };
              const totalSar = Math.round((o.totalAmount ?? 0) / 100);
              return (
                <tr
                  key={o.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-5 py-3 font-medium">#{o.sallaOrderId}</td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                    {o.customerPhone ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {totalSar.toLocaleString("ar-SA")} {o.currency}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">
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
