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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [usedAi, setUsedAi] = useState(false);

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
    setUsedAi(false);
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
    <div className="flex h-full">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        users={users}
      />
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950">
          <ThreadHeader
            conv={activeConv}
            users={users}
            onAssign={handleAssign}
            onSimulateInbound={handleSimulateInbound}
          />
          <ThreadMessages messages={messages} users={users} />
          <Composer
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={handleSend}
            suggestions={suggestions}
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
        <div className="flex-1 flex items-center justify-center text-zinc-500">
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
    <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold">المحادثات ({conversations.length})</h2>
      </div>
      <ul>
        {conversations.map((c) => {
          const assignee = users.find((u) => u.id === c.assignedUserId);
          return (
            <li
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition ${
                activeId === c.id
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {c.customerName ?? c.customerPhone}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    c.status === "open"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                  }`}
                >
                  {c.status === "open" ? "مفتوحة" : "مغلقة"}
                </span>
              </div>
              <div className="text-xs text-zinc-500 flex items-center justify-between">
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
}: {
  conv: Conversation;
  users: User[];
  onAssign: (id: string | null) => Promise<void>;
  onSimulateInbound: () => Promise<void>;
}) {
  return (
    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
      <div>
        <div className="font-semibold">{conv.customerName ?? "عميل"}</div>
        <div className="text-xs text-zinc-500">{conv.customerPhone}</div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={conv.assignedUserId ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
          className="text-sm px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
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
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition"
        >
          محاكاة رسالة واردة
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
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-zinc-400 text-sm pt-10">
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
              className={`max-w-md px-4 py-2.5 rounded-2xl ${
                isOut
                  ? "bg-emerald-500 text-white"
                  : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {isOut && sender && (
                <div className="text-[11px] opacity-80 mb-1">
                  {sender.whatsappDisplayName ?? sender.name}
                  {m.aiGenerated && " · ✨ AI"}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-6 text-sm">{m.body}</div>
              <div className={`text-[10px] mt-1 ${isOut ? "opacity-70" : "text-zinc-400"}`}>
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
  loadingSuggestions: boolean;
  onSuggest: () => Promise<void>;
  onUseSuggestion: (s: string) => void;
  currentUserName: string;
}) {
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onUseSuggestion(s)}
              className="text-right text-xs px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition max-w-md"
            >
              ✨ {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-3">
        <button
          onClick={onSuggest}
          disabled={loadingSuggestions}
          className="px-3 py-2 text-sm rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loadingSuggestions ? "جاري التفكير…" : "✨ اقتراح ردود"}
        </button>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رداً..."
          rows={2}
          className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        />
        <button
          onClick={onSend}
          disabled={sending || !draft.trim()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-50"
        >
          {sending ? "جاري…" : "إرسال"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        سيتم إرسال الرد باسم: <span className="font-medium">{currentUserName}</span>
      </p>
    </div>
  );
}
