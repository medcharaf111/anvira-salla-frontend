"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "نظرة عامة", icon: HomeIcon },
  { href: "/dashboard/inbox", label: "صندوق الواتساب", icon: ChatIcon },
  { href: "/dashboard/carts", label: "السلات المهجورة", icon: CartIcon },
  { href: "/dashboard/orders", label: "الطلبات", icon: OrdersIcon },
  { href: "/dashboard/settings", label: "الإعدادات والفريق", icon: GearIcon },
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
      <div className="flex-1 flex items-center justify-center text-ink-subtle">
        جاري التحميل…
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold">لم يتم العثور على متجر تجريبي</h2>
          <p className="text-ink-muted">
            تأكد من تشغيل الخادم الخلفي على المنفذ 8080.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-canvas">
      <aside className="w-64 border-l border-line bg-surface flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-line">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <div>
              <div className="font-semibold text-base tracking-tight">Anvira</div>
              <div className="text-[11px] text-ink-subtle leading-tight">
                منصة التشغيل لتجار سلة
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-3 px-2">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition my-0.5 ${
                  active
                    ? "bg-accent-soft text-accent-ink font-medium"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon active={!!active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="bg-canvas border border-line rounded-xl p-3">
            <label className="block text-[11px] text-ink-subtle mb-1.5 leading-tight">
              تسجيل دخول كـ (وضع تجريبي)
            </label>
            <select
              value={currentUser?.id ?? ""}
              onChange={(e) => {
                const u = users.find((x) => x.id === e.target.value);
                if (u) setCurrentUser(u);
              }}
              className="w-full px-2.5 py-1.5 rounded-md bg-surface border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role === "owner" ? "مالك" : "موظف"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#6e1ac2" />
      <path
        d="M7 17 L12 7 L17 17 M9 13 H15"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface IconProps {
  active: boolean;
}
function iconClass(active: boolean) {
  return active ? "text-accent" : "text-ink-subtle";
}

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path
        d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path
        d="M21 12a8 8 0 1 1-3.2-6.4L21 5l-1.4 3.2A7.96 7.96 0 0 1 21 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path
        d="M3 4h2l2.5 11.5a2 2 0 0 0 2 1.5h7.5a2 2 0 0 0 2-1.5L21 8H6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="20" r="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function OrdersIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path
        d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GearIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .35 1.85l.05.05a2 2 0 1 1-2.85 2.85l-.05-.05a1.7 1.7 0 0 0-1.85-.35 1.7 1.7 0 0 0-1 1.55v.15a2 2 0 1 1-4 0v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.85.35l-.05.05a2 2 0 1 1-2.85-2.85l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.35-1.85l-.05-.05a2 2 0 1 1 2.85-2.85l.05.05a1.7 1.7 0 0 0 1.85.35H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.85-.35l.05-.05a2 2 0 1 1 2.85 2.85l-.05.05a1.7 1.7 0 0 0-.35 1.85V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.55 1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
