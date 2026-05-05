"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Stats {
  conversations: number;
  openConversations: number;
  pendingCarts: number;
  totalOrders: number;
}

export default function DashboardOverview() {
  const { currentUser, merchantId } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!merchantId) return;
    Promise.all([
      api.listConversations(),
      api.listCarts(),
      api.listOrders(),
    ])
      .then(([cv, ct, or]) => {
        setStats({
          conversations: cv.conversations.length,
          openConversations: cv.conversations.filter((c) => c.status === "open").length,
          pendingCarts: ct.carts.filter((c) => !c.recoveryMessageSentAt).length,
          totalOrders: or.orders.length,
        });
      })
      .catch((err) => console.error(err));
  }, [merchantId]);

  return (
    <div className="px-8 py-10 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">
        أهلاً، {currentUser?.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-zinc-500 mb-8">نظرة سريعة على نشاط المتجر اليوم.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="المحادثات النشطة"
          value={stats?.openConversations ?? "…"}
          total={stats?.conversations}
          color="emerald"
        />
        <StatCard
          label="السلات المهجورة"
          value={stats?.pendingCarts ?? "…"}
          color="amber"
        />
        <StatCard
          label="الطلبات الكلية"
          value={stats?.totalOrders ?? "…"}
          color="blue"
        />
        <StatCard
          label="ردود AI متاحة"
          value={"24/7"}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="font-semibold mb-2">الميزات الفعالة في هذا العرض التجريبي</h2>
        <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 leading-7">
          <li>✓ صندوق رسائل واتساب مشترك مع توزيع للموظفين</li>
          <li>✓ ذكاء اصطناعي حقيقي (Gemini) يقترح ٣ ردود لكل محادثة</li>
          <li>✓ استرجاع السلات المهجورة برسائل آلية مخصصة</li>
          <li>✓ صلاحيات (مالك / موظف) وعرض اسم الموظف على الرسائل</li>
          <li>✓ بيانات تجريبية لمتجر "متجر الأناقة" — لا يحتاج اتصال سلة حقيقي</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: string | number;
  total?: number;
  color: "emerald" | "amber" | "blue" | "purple";
}) {
  const colors = {
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
  } as const;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}
        >
          {value}
        </span>
        {total !== undefined && (
          <span className="text-sm text-zinc-400">/ {total}</span>
        )}
      </div>
    </div>
  );
}
