"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { NotificationsBell } from "@/components/notifications-bell";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "نظرة عامة", icon: HomeIcon, group: "main" },
  { href: "/dashboard/inbox", label: "صندوق الواتساب", icon: ChatIcon, group: "main" },
  { href: "/dashboard/customers", label: "العملاء (CRM)", icon: UsersIcon, group: "main" },
  { href: "/dashboard/carts", label: "السلات المهجورة", icon: CartIcon, group: "main" },
  { href: "/dashboard/orders", label: "الطلبات", icon: OrdersIcon, group: "main" },
  { href: "/dashboard/tasks", label: "المهام", icon: TasksIcon, group: "ops" },
  { href: "/dashboard/team", label: "تشات الفريق", icon: TeamIcon, group: "ops" },
  { href: "/dashboard/insights", label: "تحليلات AI", icon: SparkleIcon, group: "ops" },
  { href: "/dashboard/knowledge", label: "قاعدة المعرفة", icon: BookIcon, group: "ops" },
  { href: "/dashboard/workflows", label: "الأتمتات", icon: WorkflowIcon, group: "ops" },
  { href: "/dashboard/apps", label: "متجر التطبيقات", icon: AppsIcon, group: "ops" },
  { href: "/dashboard/api-keys", label: "API Keys", icon: KeyIcon, group: "system" },
  { href: "/dashboard/activity", label: "سجل النشاط", icon: ActivityIcon, group: "system" },
  { href: "/dashboard/settings", label: "الإعدادات والفريق", icon: GearIcon, group: "system" },
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
        <div className="px-5 py-4 border-b border-line">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <Logo />
            <div className="font-semibold text-base tracking-tight">Anvira</div>
          </Link>
          <MerchantSwitcher />
        </div>

        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {(["main", "ops", "system"] as const).map((group, gi) => {
            const items = navItems.filter((n) => n.group === group);
            return (
              <div key={group} className={gi === 0 ? "" : "mt-3 pt-2 border-t border-line/60"}>
                {items.map((item) => {
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
              </div>
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-line bg-surface flex items-center justify-between px-6 shrink-0">
          <div className="text-xs text-ink-subtle">
            {/* Breadcrumb / page title placeholder — pages set their own header */}
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <OnboardingWizard />
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

function MerchantSwitcher() {
  const { merchant, merchants, switchMerchant, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (!merchant) return null;

  const activeMerchants = merchants.filter((m) => !m.uninstalled);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-canvas border border-line hover:border-accent transition disabled:opacity-50"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-accent-soft text-accent-ink flex items-center justify-center text-[11px] font-semibold shrink-0">
            {merchant.name.slice(0, 1)}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[13px] font-medium truncate">{merchant.name}</div>
            <div className="text-[10px] text-ink-subtle truncate">
              {merchant.isDemo ? "متجر تجريبي (demo)" : merchant.domain ?? merchant.sallaStoreId}
            </div>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ink-subtle shrink-0">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full inset-x-0 mt-1 bg-surface rounded-lg border border-line shadow-lg z-30 max-h-64 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-ink-subtle border-b border-line">
            تبديل المتجر ({activeMerchants.length})
          </div>
          {activeMerchants.map((m) => (
            <button
              key={m.id}
              onClick={async () => {
                setOpen(false);
                if (m.id !== merchant.id) await switchMerchant(m.id);
              }}
              className={`w-full text-right px-3 py-2 hover:bg-surface-2 transition flex items-start gap-2 ${
                m.id === merchant.id ? "bg-accent-soft/30" : ""
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-surface-2 flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0.5">
                {m.name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate flex items-center gap-1.5">
                  {m.name}
                  {m.isDemo && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-warn-soft text-warn">demo</span>
                  )}
                  {m.id === merchant.id && (
                    <span className="text-[9px] text-accent">✓</span>
                  )}
                </div>
                <div className="text-[10px] text-ink-subtle truncate">
                  {m.domain ?? m.sallaStoreId}
                </div>
              </div>
            </button>
          ))}
          <div className="px-3 py-2 border-t border-line text-[10px] text-ink-subtle">
            متاجر إضافية تظهر تلقائياً عند التثبيت من سلة
          </div>
        </div>
      )}
    </div>
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

function UsersIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function TasksIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TeamIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="13" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function SparkleIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkflowIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="15" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="15" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 6h3a3 3 0 0 1 3 3v3M9 18h3a3 3 0 0 0 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AppsIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ActivityIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={iconClass(active)}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
