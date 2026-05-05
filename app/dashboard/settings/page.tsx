"use client";

import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { currentUser, merchantId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  const isOwner = currentUser?.role === "owner";

  async function load() {
    const r = await api.listUsers();
    setUsers(r.users);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  async function saveDisplayName(u: User) {
    const next = editing[u.id];
    if (next === undefined) return;
    await api.updateUser(u.id, { whatsappDisplayName: next });
    setEditing((e) => {
      const copy = { ...e };
      delete copy[u.id];
      return copy;
    });
    await load();
  }

  async function createUser() {
    if (!newName || !newEmail) return;
    setCreating(true);
    try {
      await api.createUser({
        name: newName,
        email: newEmail,
        whatsappDisplayName: newDisplayName || undefined,
        role: "agent",
      });
      setNewName("");
      setNewEmail("");
      setNewDisplayName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-10 py-12 max-w-3xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">الإعدادات</p>
        <h1 className="text-3xl font-semibold tracking-tight">الفريق والصلاحيات</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          إدارة موظفي الفريق والاسم الذي يظهر للعميل عند الرد عبر الواتساب.
        </p>
      </header>

      {!isOwner && (
        <div className="mb-6 p-4 rounded-xl bg-warn-soft text-warn text-sm border border-warn/20">
          ⚠️ بعض الإعدادات تظهر لك لكنها متاحة للمالك فقط.
        </div>
      )}

      <section className="bg-surface rounded-2xl border border-line mb-7 overflow-hidden">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="font-semibold tracking-tight">الفريق</h2>
          <p className="text-xs text-ink-subtle mt-0.5">
            {users.length} عضو · {users.filter((u) => u.role === "owner").length} مالك ·{" "}
            {users.filter((u) => u.role === "agent").length} موظفون
          </p>
        </div>
        <ul>
          {users.map((u) => (
            <li
              key={u.id}
              className="px-6 py-5 border-b border-line/60 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-ink-subtle mt-0.5">
                    {u.email}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    u.role === "owner"
                      ? "bg-accent-soft text-accent-ink"
                      : "bg-surface-3 text-ink-muted"
                  }`}
                >
                  {u.role === "owner" ? "مالك" : "موظف"}
                </span>
              </div>
              <div className="text-[11px] text-ink-subtle mb-1.5">
                الاسم الظاهر للعميل على الواتساب
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editing[u.id] ?? u.whatsappDisplayName ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  disabled={!isOwner}
                  className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-60"
                />
                {isOwner && editing[u.id] !== undefined && (
                  <button
                    onClick={() => saveDisplayName(u)}
                    className="px-3 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition"
                  >
                    حفظ
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="bg-surface rounded-2xl border border-line p-6">
          <h2 className="font-semibold mb-1 tracking-tight">إضافة موظف جديد</h2>
          <p className="text-xs text-ink-subtle mb-4">
            الموظف الجديد يبدأ بدور "موظف" — يمكن للمالك ترقيته لاحقاً.
          </p>
          <div className="space-y-3">
            <Input
              label="الاسم الكامل"
              value={newName}
              onChange={setNewName}
              placeholder="مثلاً: ليلى الحربي"
            />
            <Input
              label="البريد الإلكتروني"
              value={newEmail}
              onChange={setNewEmail}
              placeholder="leila@..."
            />
            <Input
              label="الاسم الظاهر على الواتساب (اختياري)"
              value={newDisplayName}
              onChange={setNewDisplayName}
              placeholder="ليلى - خدمة العملاء"
            />
            <button
              onClick={createUser}
              disabled={creating || !newName || !newEmail}
              className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50 transition shadow-sm"
            >
              {creating ? "...جاري الإضافة" : "إضافة موظف"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-ink-subtle">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </label>
  );
}
