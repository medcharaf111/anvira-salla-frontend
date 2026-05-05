"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type CustomerSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function CustomersListPage() {
  const { merchantId } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    if (!merchantId) return;
    api.listCustomers().then((r) => setCustomers(r.customers)).catch(console.error);
  }, [merchantId]);

  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">CRM</p>
        <h1 className="text-3xl font-semibold tracking-tight">العملاء</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          قائمة بكل من تفاعل مع متجرك. اضغط على أي عميل لعرض محادثاته وطلباته وملاحظاتك عنه.
        </p>
      </header>

      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2/60 text-ink-subtle">
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                العميل
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                الجوال
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                المحادثات
              </th>
              <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">
                آخر تواصل
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-ink-subtle py-12">
                  لا توجد بيانات
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr
                key={c.phone}
                className="border-t border-line/60 hover:bg-canvas/50 transition"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/dashboard/customers/${encodeURIComponent(c.phone)}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {c.name ?? "—"}
                  </Link>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">
                  {c.phone}
                </td>
                <td className="px-5 py-3.5">{c.conversationCount}</td>
                <td className="px-5 py-3.5 text-ink-subtle text-xs">
                  {new Date(c.lastSeen).toLocaleString("ar-SA", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
