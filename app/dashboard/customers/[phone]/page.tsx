"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, type CustomerProfile, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABEL: Record<string, string> = {
  shipped: "تم الشحن",
  processing: "قيد التجهيز",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = use(params);
  const decoded = decodeURIComponent(phone);
  const { merchantId, users } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    const r = await api.getCustomer(decoded);
    setProfile(r);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId, decoded]);

  async function addNote() {
    if (!newNote.trim()) return;
    setAdding(true);
    try {
      await api.addCustomerNote(decoded, newNote.trim());
      setNewNote("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function deleteNote(id: string) {
    await api.deleteCustomerNote(decoded, id);
    await load();
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-ink-subtle">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="px-10 py-12 max-w-4xl">
      <Link href="/dashboard/customers" className="text-sm text-ink-muted hover:text-ink mb-3 inline-block">
        ← العودة للعملاء
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.name ?? "عميل بدون اسم"}
        </h1>
        <p className="text-ink-muted mt-1 font-mono text-sm">{profile.phone}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={`الطلبات (${profile.orders.length})`}>
          {profile.orders.length === 0 ? (
            <Empty>لا توجد طلبات</Empty>
          ) : (
            <ul className="divide-y divide-line/60">
              {profile.orders.map((o) => (
                <li key={o.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm">#{o.sallaOrderId}</div>
                    <div className="text-xs text-ink-subtle">
                      {STATUS_LABEL[o.status] ?? o.status} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {Math.round((o.totalAmount ?? 0) / 100).toLocaleString("ar-SA")}{" "}
                    <span className="text-ink-subtle text-xs font-normal">{o.currency}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`المحادثات (${profile.conversations.length})`}>
          {profile.conversations.length === 0 ? (
            <Empty>لا توجد محادثات</Empty>
          ) : (
            <ul className="divide-y divide-line/60">
              {profile.conversations.map((c) => (
                <li key={c.id} className="py-2.5">
                  <Link
                    href={`/dashboard/inbox`}
                    className="text-sm hover:text-accent transition"
                  >
                    <div className="flex items-center justify-between">
                      <span>محادثة #{c.id.slice(0, 8)}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          c.status === "open"
                            ? "bg-success-soft text-success"
                            : "bg-surface-3 text-ink-subtle"
                        }`}
                      >
                        {c.status === "open" ? "مفتوحة" : "مغلقة"}
                      </span>
                    </div>
                    <div className="text-xs text-ink-subtle mt-0.5">
                      آخر نشاط: {new Date(c.lastMessageAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={`الملاحظات (${profile.notes.length})`}>
        <div className="space-y-3 mb-4">
          {profile.notes.length === 0 && <Empty>لا توجد ملاحظات بعد</Empty>}
          {profile.notes.map((n) => {
            const author = users.find((u) => u.id === n.authorUserId);
            return (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-surface-2 border border-line/60"
              >
                <p className="text-sm leading-7">{n.body}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-ink-subtle">
                  <span>
                    {author?.name ?? "—"} ·{" "}
                    {new Date(n.createdAt).toLocaleString("ar-SA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="text-danger hover:underline"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-end gap-2 pt-3 border-t border-line/60">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="اكتب ملاحظة عن هذا العميل (مثلاً: تفضيلاته، تاريخ تعامله...)"
            rows={2}
            className="flex-1 resize-none px-3 py-2 rounded-lg bg-canvas border border-line focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
          />
          <button
            onClick={addNote}
            disabled={adding || !newNote.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
          >
            {adding ? "..." : "إضافة"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <h3 className="font-semibold mb-3 tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-ink-subtle text-sm py-4">{children}</div>;
}
