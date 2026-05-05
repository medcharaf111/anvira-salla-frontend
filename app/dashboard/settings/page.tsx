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
    <div className="px-8 py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">الإعدادات والفريق</h1>
      <p className="text-zinc-500 text-sm mb-8">
        إدارة موظفي الفريق والاسم الذي يظهر للعميل عند الرد.
      </p>

      {!isOwner && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ بعض الإعدادات تظهر لك لكن متاحة فقط للمالك.
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-8">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
          الفريق ({users.length})
        </div>
        <ul>
          {users.map((u) => (
            <li
              key={u.id}
              className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-zinc-500">
                    {u.email} · {u.role === "owner" ? "مالك" : "موظف"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mb-1">
                الاسم الظاهر للعميل على الواتساب:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editing[u.id] ?? u.whatsappDisplayName ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  disabled={!isOwner}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm disabled:opacity-60"
                />
                {isOwner && editing[u.id] !== undefined && (
                  <button
                    onClick={() => saveDisplayName(u)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm hover:bg-emerald-600"
                  >
                    حفظ
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isOwner && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="font-semibold mb-3">إضافة موظف جديد</h2>
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
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 disabled:opacity-50"
            >
              {creating ? "جاري الإضافة…" : "إضافة موظف"}
            </button>
          </div>
        </div>
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
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
      />
    </label>
  );
}
