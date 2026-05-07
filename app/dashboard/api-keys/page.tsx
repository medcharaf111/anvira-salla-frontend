"use client";

import { useEffect, useState } from "react";
import { api, type ApiKey } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ApiKeysPage() {
  const { merchantId, currentUser } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ name: string; plaintext: string } | null>(null);

  async function load() {
    const r = await api.listApiKeys();
    setKeys(r.keys);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await api.createApiKey(newName.trim());
      setRevealedKey({ name: r.key.name, plaintext: r.plaintext });
      setNewName("");
      setShowCreate(false);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("إلغاء هذا المفتاح؟ لا يمكن التراجع.")) return;
    await api.revokeApiKey(id);
    await load();
  }

  return (
    <div className="px-10 py-12 max-w-4xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">المفاتيح الشخصية</p>
        <h1 className="text-3xl font-semibold tracking-tight">API Keys</h1>
        <p className="text-ink-muted mt-2 text-[15px] leading-relaxed">
          كل موظف يولّد مفاتيح API خاصة بحسابه. الرسائل والإجراءات المرسلة عبر API تظهر باسم الموظف على الواتساب — ليس "بوت".
        </p>
      </header>

      <div className="bg-info-soft/40 border border-info/15 rounded-2xl p-4 mb-6 text-sm leading-7">
        <span className="text-info font-medium">ℹ️ ملاحظة: </span>
        <span className="text-ink-muted">
          أنت مسجّل دخول كـ <strong>{currentUser?.name}</strong>. تظهر هنا المفاتيح المرتبطة بحسابك فقط.
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold tracking-tight">مفاتيحي ({keys.length})</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover"
        >
          + توليد مفتاح جديد
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        {keys.length === 0 ? (
          <div className="text-center text-ink-subtle py-12">
            لا توجد مفاتيح بعد. ولّد مفتاحك الأول لتبدأ استخدام Anvira API.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2/60 text-ink-subtle">
                <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">الاسم</th>
                <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">المفتاح</th>
                <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">الاستخدام</th>
                <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider">آخر استعمال</th>
                <th className="text-right px-5 py-3 font-medium text-xs uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-line/60">
                  <td className="px-5 py-3.5 font-medium">{k.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink-muted">
                    anv_••••••••••{k.keyPreview}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-ink">{k.callCount.toLocaleString("ar-SA")}</span>
                    <span className="text-ink-subtle text-xs"> استدعاء</span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-subtle text-xs">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "لم يُستخدم بعد"}
                  </td>
                  <td className="px-5 py-3.5 text-left">
                    <button
                      onClick={() => revoke(k.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      إلغاء
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8 p-5 rounded-2xl bg-surface-2/40 border border-dashed border-line text-sm leading-7 text-ink-muted">
        💡 <strong className="text-ink">صلاحيات المفتاح:</strong> كل مفتاح يحمل نفس صلاحيات حسابك. لو دورك "موظف"، المفتاح لا يستطيع الإدارة. لو "مالك"، المفتاح يفعل كل شيء.
      </div>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <h3 className="font-semibold mb-3 tracking-tight">توليد مفتاح جديد</h3>
          <p className="text-sm text-ink-muted mb-4 leading-7">
            اختر اسم وصفي للمفتاح (مثلاً: "Zapier integration"، "n8n local").
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم المفتاح..."
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-surface-2 text-sm hover:bg-surface-3">
              إلغاء
            </button>
            <button
              onClick={create}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
            >
              {creating ? "..." : "توليد"}
            </button>
          </div>
        </Modal>
      )}

      {revealedKey && (
        <Modal onClose={() => setRevealedKey(null)}>
          <h3 className="font-semibold mb-2 tracking-tight">المفتاح جاهز ✓</h3>
          <p className="text-sm text-ink-muted leading-7 mb-4">
            انسخ هذا المفتاح الآن واحفظه في مكان آمن — لن يُعرض مرة أخرى.
          </p>
          <div className="bg-canvas border border-line rounded-lg p-3 font-mono text-xs break-all mb-4 select-all">
            {revealedKey.plaintext}
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(revealedKey.plaintext)}
              className="text-xs text-accent hover:underline"
            >
              نسخ المفتاح
            </button>
            <button
              onClick={() => setRevealedKey(null)}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover"
            >
              فهمت، حفظته
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
