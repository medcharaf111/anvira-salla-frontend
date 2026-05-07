"use client";

import { useEffect, useState } from "react";
import { api, type KnowledgeEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function KnowledgeBasePage() {
  const { merchantId } = useAuth();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const r = await api.listKnowledge();
    setEntries(r.entries);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  async function toggle(e: KnowledgeEntry) {
    await api.updateKnowledge(e.id, { enabled: !e.enabled });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا السؤال من قاعدة المعلومات؟")) return;
    await api.deleteKnowledge(id);
    await load();
  }

  return (
    <div className="px-10 py-12 max-w-4xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">قاعدة معلومات AI</p>
        <h1 className="text-3xl font-semibold tracking-tight">المعرفة</h1>
        <p className="text-ink-muted mt-2 text-[15px] leading-relaxed">
          أسئلة وأجوبة يستخدمها Anvira AI كمرجع عند اقتراح الردود. كلما كانت أكثر دقة، كانت اقتراحات الـ AI أدق.
        </p>
      </header>

      <div className="bg-accent-soft/40 border border-accent/15 rounded-2xl p-4 mb-5 text-sm leading-7">
        <span className="text-accent-ink font-medium">✨ كيف يعمل: </span>
        <span className="text-ink-muted">
          عندما تطلب اقتراح ردود من Anvira AI في الإنبوكس، الذكاء الاصطناعي يقرأ هذه القاعدة أولاً ويبني ردوده على المعلومات المحدثة فيها.
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold tracking-tight">الأسئلة ({entries.length})</h2>
        <button
          onClick={() => {
            setEditing({
              id: "",
              merchantId: "",
              question: "",
              answer: "",
              tags: [],
              enabled: true,
              createdAt: "",
            });
            setCreating(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover"
        >
          + إضافة سؤال
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="text-center text-ink-subtle py-12 bg-surface border border-dashed border-line rounded-2xl">
            لا توجد أسئلة بعد. أضف الأسئلة المتكررة من عملائك ليفهمها AI.
          </div>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            className={`bg-surface rounded-2xl border p-5 transition ${
              e.enabled ? "border-line" : "border-line/40 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="font-medium text-[15px]">{e.question}</div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggle(e)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition ${
                    e.enabled ? "bg-success-soft text-success" : "bg-surface-3 text-ink-subtle"
                  }`}
                >
                  {e.enabled ? "✓ مفعّل" : "معطّل"}
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-7">{e.answer}</p>
            {e.tags && e.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-line/60">
              <button
                onClick={() => setEditing(e)}
                className="text-xs text-accent hover:underline"
              >
                تعديل
              </button>
              <button
                onClick={() => remove(e.id)}
                className="text-xs text-danger hover:underline"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EntryModal
          entry={editing}
          isNew={creating}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={async (e) => {
            if (creating) {
              await api.createKnowledge({
                question: e.question,
                answer: e.answer,
                tags: e.tags,
              });
            } else {
              await api.updateKnowledge(editing.id, {
                question: e.question,
                answer: e.answer,
                tags: e.tags,
              });
            }
            setEditing(null);
            setCreating(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EntryModal({
  entry,
  isNew,
  onClose,
  onSave,
}: {
  entry: KnowledgeEntry;
  isNew: boolean;
  onClose: () => void;
  onSave: (e: KnowledgeEntry) => Promise<void>;
}) {
  const [question, setQuestion] = useState(entry.question);
  const [answer, setAnswer] = useState(entry.answer);
  const [tags, setTags] = useState((entry.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...entry,
        question: question.trim(),
        answer: answer.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/30 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line p-6 max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4 tracking-tight">
          {isNew ? "إضافة سؤال للقاعدة" : "تعديل السؤال"}
        </h3>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] text-ink-subtle">السؤال</span>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثلاً: كم تأخذ مدة الشحن؟"
              className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-ink-subtle">الإجابة (الذكاء الاصطناعي يستخدمها كمرجع)</span>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="إجابة شاملة بأسلوب طبيعي..."
              rows={4}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-ink-subtle">وسوم (اختياري، مفصولة بفواصل)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="شحن، توصيل، عاجل"
              className="w-full mt-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-2 text-sm hover:bg-surface-3"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            disabled={saving || !question.trim() || !answer.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
