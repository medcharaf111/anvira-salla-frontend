"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Conversation, type Message, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function InboxPage() {
  const { merchantId, users, currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiSource, setAiSource] = useState<"gemini" | "fallback" | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [summary, setSummary] = useState<{ text: string; source: "gemini" | "fallback" } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const refreshList = useCallback(async () => {
    const r = await api.listConversations();
    setConversations(r.conversations);
    if (!activeId && r.conversations[0]) {
      setActiveId(r.conversations[0].id);
    }
  }, [activeId]);

  useEffect(() => {
    if (!merchantId) return;
    refreshList().catch(console.error);
  }, [merchantId, refreshList]);

  const loadThread = useCallback(async (id: string) => {
    const r = await api.getConversation(id);
    setMessages(r.messages);
    setSuggestions([]);
    setAiSource(null);
    setUsedAi(false);
    setSummary(null);
  }, []);

  useEffect(() => {
    if (activeId) loadThread(activeId).catch(console.error);
  }, [activeId, loadThread]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  async function handleSuggest() {
    if (!activeId) return;
    setLoadingSuggestions(true);
    try {
      const r = await api.suggestReplies(activeId);
      setSuggestions(r.suggestions);
      setAiSource(r.source);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(activeId, draft.trim(), usedAi);
      setDraft("");
      setUsedAi(false);
      setSuggestions([]);
      setAiSource(null);
      await loadThread(activeId);
      await refreshList();
    } finally {
      setSending(false);
    }
  }

  async function handleAssign(userId: string | null) {
    if (!activeId) return;
    await api.assignConversation(activeId, userId);
    await refreshList();
  }

  async function handleSummarize() {
    if (!activeId) return;
    setLoadingSummary(true);
    try {
      const r = await api.summarizeConversation(activeId);
      setSummary(r);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleSimulateInbound() {
    if (!activeId || !activeConv) return;
    const samples = [
      "تمام، جزاك الله خير 🙏",
      "ممكن السعر أحسن؟",
      "هل يصل الرياض اليوم؟",
      "أبغى الفاتورة لو سمحت",
      "متى ينزل الموديل الجديد؟",
    ];
    const body = samples[Math.floor(Math.random() * samples.length)];
    await api.simulateInbound(body, { conversationId: activeId });
    await loadThread(activeId);
    await refreshList();
  }

  return (
    <div className="flex h-full bg-canvas">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        users={users}
      />
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-canvas">
          <ThreadHeader
            conv={activeConv}
            users={users}
            onAssign={handleAssign}
            onSimulateInbound={handleSimulateInbound}
            onSummarize={handleSummarize}
            loadingSummary={loadingSummary}
          />
          {summary && (
            <SummaryPanel
              summary={summary}
              onClose={() => setSummary(null)}
            />
          )}
          <ThreadMessages messages={messages} users={users} />
          <Composer
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={handleSend}
            suggestions={suggestions}
            aiSource={aiSource}
            loadingSuggestions={loadingSuggestions}
            onSuggest={handleSuggest}
            onUseSuggestion={(s) => {
              setDraft(s);
              setUsedAi(true);
              setSuggestions([]);
            }}
            currentUserName={currentUser?.whatsappDisplayName ?? currentUser?.name ?? ""}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-subtle">
          اختر محادثة من القائمة
        </div>
      )}
    </div>
  );
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  users,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  users: User[];
}) {
  return (
    <div className="w-80 border-l border-line bg-surface overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-line">
        <div className="font-semibold tracking-tight">المحادثات</div>
        <div className="text-xs text-ink-subtle mt-0.5">
          {conversations.length} محادثة
        </div>
      </div>
      <ul>
        {conversations.map((c) => {
          const assignee = users.find((u) => u.id === c.assignedUserId);
          const isActive = activeId === c.id;
          return (
            <li
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`px-5 py-3.5 border-b border-line/60 cursor-pointer transition ${
                isActive
                  ? "bg-accent-soft border-r-2 border-r-accent"
                  : "hover:bg-surface-2"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isActive ? "text-accent-ink" : "text-ink"}`}>
                  {c.customerName ?? c.customerPhone}
                </span>
                {c.status === "open" ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-soft text-success">
                    مفتوحة
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-ink-subtle">
                    مغلقة
                  </span>
                )}
              </div>
              <div className="text-[11px] text-ink-subtle flex items-center justify-between">
                <span>{c.customerPhone}</span>
                <span>{assignee?.name?.split(" ")[0] ?? "غير معيّنة"}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ThreadHeader({
  conv,
  users,
  onAssign,
  onSimulateInbound,
  onSummarize,
  loadingSummary,
}: {
  conv: Conversation;
  users: User[];
  onAssign: (id: string | null) => Promise<void>;
  onSimulateInbound: () => Promise<void>;
  onSummarize: () => Promise<void>;
  loadingSummary: boolean;
}) {
  return (
    <div className="px-7 py-4 border-b border-line bg-surface flex items-center justify-between gap-4">
      <div>
        <div className="font-semibold tracking-tight">{conv.customerName ?? "عميل"}</div>
        <div className="text-xs text-ink-subtle">{conv.customerPhone}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onSummarize}
          disabled={loadingSummary}
          className="text-xs px-3 py-1.5 rounded-lg bg-accent-soft text-accent-ink hover:bg-accent-soft-hover transition disabled:opacity-50"
        >
          {loadingSummary ? "جاري التلخيص..." : "✨ تلخيص"}
        </button>
        <select
          value={conv.assignedUserId ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
          className="text-sm px-3 py-1.5 rounded-lg bg-canvas border border-line focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        >
          <option value="">غير معيّنة</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <button
          onClick={onSimulateInbound}
          className="text-xs px-3 py-1.5 rounded-lg bg-warn-soft text-warn hover:opacity-90 transition"
        >
          محاكاة رسالة واردة
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({
  summary,
  onClose,
}: {
  summary: { text: string; source: "gemini" | "fallback" };
  onClose: () => void;
}) {
  return (
    <div className="px-7 py-4 border-b border-line bg-accent-soft/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-accent-ink mb-2 flex items-center gap-1.5">
            <span>✨</span>
            ملخص المحادثة بالذكاء الاصطناعي
            {summary.source === "fallback" && (
              <span className="text-warn">(قالب احتياطي)</span>
            )}
          </div>
          <div className="text-sm text-ink whitespace-pre-wrap leading-7">
            {summary.text}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-ink-subtle hover:text-ink text-sm leading-none mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ThreadMessages({
  messages,
  users,
}: {
  messages: Message[];
  users: User[];
}) {
  return (
    <div className="flex-1 overflow-y-auto px-7 py-7 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-ink-subtle text-sm pt-10">
          لا توجد رسائل بعد
        </div>
      )}
      {messages.map((m) => {
        const sender = users.find((u) => u.id === m.sentByUserId);
        const isOut = m.direction === "out";
        return (
          <div
            key={m.id}
            className={`flex ${isOut ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-md px-4 py-2.5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
                isOut
                  ? "bg-accent text-white rounded-tl-md"
                  : "bg-surface border border-line rounded-tr-md"
              }`}
            >
              {isOut && sender && (
                <div className="text-[11px] opacity-85 mb-1">
                  {sender.whatsappDisplayName ?? sender.name}
                  {m.aiGenerated && " · ✨ AI"}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-7 text-[14px]">{m.body}</div>
              <div
                className={`text-[10px] mt-1 ${isOut ? "opacity-75" : "text-ink-subtle"}`}
              >
                {new Date(m.createdAt).toLocaleString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  sending,
  onSend,
  suggestions,
  aiSource,
  loadingSuggestions,
  onSuggest,
  onUseSuggestion,
  currentUserName,
}: {
  draft: string;
  setDraft: (s: string) => void;
  sending: boolean;
  onSend: () => Promise<void>;
  suggestions: string[];
  aiSource: "gemini" | "fallback" | null;
  loadingSuggestions: boolean;
  onSuggest: () => Promise<void>;
  onUseSuggestion: (s: string) => void;
  currentUserName: string;
}) {
  return (
    <div className="border-t border-line bg-surface p-4 space-y-3">
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] text-ink-subtle flex items-center gap-1.5">
            <span className="text-accent">✨</span>
            اقتراحات Anvira AI
            {aiSource === "fallback" && (
              <span className="text-warn">(قالب احتياطي — ${'‎'}AI غير متاح حالياً)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onUseSuggestion(s)}
                className="text-right text-[13px] px-3.5 py-2.5 rounded-xl bg-canvas border border-line hover:border-accent hover:bg-accent-soft/40 transition max-w-md leading-6"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-end gap-2.5">
        <button
          onClick={onSuggest}
          disabled={loadingSuggestions}
          className="px-3.5 py-2.5 text-sm rounded-xl bg-accent-soft text-accent-ink hover:bg-accent-soft-hover transition disabled:opacity-50 shrink-0"
        >
          {loadingSuggestions ? "…جاري" : "✨ اقتراح ردود"}
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رداً..."
          rows={2}
          className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-canvas border border-line focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
        />
        <button
          onClick={onSend}
          disabled={sending || !draft.trim()}
          className="px-5 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50 shrink-0 shadow-sm"
        >
          {sending ? "…جاري" : "إرسال"}
        </button>
      </div>
      <p className="text-[11px] text-ink-subtle">
        سيتم إرسال الرد باسم: <span className="font-medium text-ink">{currentUserName}</span>
      </p>
    </div>
  );
}
