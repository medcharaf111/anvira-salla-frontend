"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Stats {
  conversations: number;
  openConversations: number;
  pendingCarts: number;
  recoveredCarts: number;
  totalOrders: number;
  todayOrders: number;
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStats({
          conversations: cv.conversations.length,
          openConversations: cv.conversations.filter((c) => c.status === "open").length,
          pendingCarts: ct.carts.filter((c) => !c.recoveryMessageSentAt).length,
          recoveredCarts: ct.carts.filter((c) => c.recoveryMessageSentAt).length,
          totalOrders: or.orders.length,
          todayOrders: or.orders.filter(
            (o) => new Date(o.createdAt) >= today
          ).length,
        });
      })
      .catch((err) => console.error(err));
  }, [merchantId]);

  return (
    <div className="px-10 py-12 max-w-6xl">
      <header className="mb-10">
        <p className="text-sm text-ink-subtle mb-1">نظرة عامة</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          أهلاً، {currentUser?.name?.split(" ")[0] ?? ""} 👋
        </h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          ملخص نشاط متجرك خلال اليوم.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="محادثات نشطة"
          value={stats?.openConversations}
          sub={
            stats
              ? `من إجمالي ${stats.conversations} محادثة`
              : undefined
          }
        />
        <StatCard
          label="سلات بانتظار الاسترجاع"
          value={stats?.pendingCarts}
          sub={
            stats !== null && stats !== undefined
              ? `${stats?.recoveredCarts ?? 0} استرجعت`
              : undefined
          }
          accent
        />
        <StatCard
          label="طلبات اليوم"
          value={stats?.todayOrders}
          sub={
            stats ? `${stats.totalOrders} إجمالي` : undefined
          }
        />
        <StatCard label="ردود AI" value="∞" sub="متاحة على مدار الساعة" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="ميزات تعمل في هذه الجلسة"
          items={[
            "صندوق رسائل واتساب مشترك مع توزيع تلقائي",
            "ذكاء اصطناعي حقيقي (Gemini) يقترح ٣ ردود لكل محادثة",
            "استرجاع السلات المهجورة برسائل آلية مخصصة",
            "صلاحيات: مالك / موظف، مع اسم الموظف على الرسائل",
            "بيانات تجريبية لمتجر وهمي — لا اتصال سلة حقيقي مطلوب",
          ]}
        />
        <Section
          title="الخطوات التالية"
          items={[
            "نشر العرض على Vercel + Railway للحصول على رابط عام",
            "إضافة لوحة تحليلات (sentiment، أكثر الأسئلة، أداء الفريق)",
            "تكامل تويليو/واتساب الفعلي بعد التجربة",
            "تطبيق مع منصة سلة عبر partners.salla.dev",
          ]}
          muted
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  accent?: boolean;
}) {
  const display = value === null || value === undefined ? "—" : value;
  return (
    <div
      className={`rounded-2xl p-5 border ${
        accent
          ? "bg-accent-soft border-accent/20"
          : "bg-surface border-line"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-ink-subtle mb-2">
        {label}
      </div>
      <div className={`text-3xl font-semibold ${accent ? "text-accent-ink" : "text-ink"}`}>
        {display}
      </div>
      {sub && (
        <div className={`text-xs mt-1 ${accent ? "text-accent-ink/70" : "text-ink-subtle"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        muted ? "bg-surface-2/60 border-line" : "bg-surface border-line"
      }`}
    >
      <h3 className="font-semibold mb-4 tracking-tight">{title}</h3>
      <ul className="space-y-2.5 text-[14px] text-ink-muted leading-7">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="text-accent mt-1.5 shrink-0">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
