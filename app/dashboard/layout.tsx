"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "نظرة عامة", icon: "🏠" },
  { href: "/dashboard/inbox", label: "صندوق الواتساب", icon: "💬" },
  { href: "/dashboard/carts", label: "السلات المهجورة", icon: "🛒" },
  { href: "/dashboard/orders", label: "الطلبات", icon: "📦" },
  { href: "/dashboard/settings", label: "الإعدادات والفريق", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { users, currentUser, setCurrentUser, loading, merchantId } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500">جاري التحميل…</div>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">لم يتم العثور على متجر تجريبي</h2>
          <p className="text-zinc-500">
            تأكد من تشغيل الخادم الخلفي على المنفذ 8080.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-zinc-50 dark:bg-zinc-950">
      <aside className="w-64 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Anvira
          </Link>
          <p className="text-xs text-zinc-500 mt-1">منصة التشغيل لتجار سلة</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm transition ${
                  active
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-500"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <label className="block text-xs text-zinc-500 mb-1">
            تسجيل دخول كـ (وضع تجريبي)
          </label>
          <select
            value={currentUser?.id ?? ""}
            onChange={(e) => {
              const u = users.find((x) => x.id === e.target.value);
              if (u) setCurrentUser(u);
            }}
            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role === "owner" ? "مالك" : "موظف"})
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500 mt-2 leading-5">
            في النسخة الكاملة هذا التبديل يتم عبر OAuth الحقيقي من سلة.
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
