"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type TeamChannel, type TeamMessage, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function TeamChatPage() {
  const { merchantId, users, currentUser } = useAuth();
  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const load = useCallback(async () => {
    const r = await api.listChannels();
    setChannels(r.channels);
    if (!activeId && r.channels[0]) setActiveId(r.channels[0].id);
  }, [activeId]);

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId, load]);

  useEffect(() => {
    if (!activeId) return;
    api.getChannel(activeId).then((r) => setMessages(r.messages)).catch(console.error);
  }, [activeId]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeId) ?? null,
    [channels, activeId]
  );

  async function sendMessage() {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      await api.postChannelMessage(activeId, draft.trim());
      setDraft("");
      const r = await api.getChannel(activeId);
      setMessages(r.messages);
    } finally {
      setSending(false);
    }
  }

  async function createChannel() {
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      await api.createChannel(newChannelName.trim().toLowerCase());
      setNewChannelName("");
      await load();
    } finally {
      setCreatingChannel(false);
    }
  }

  return (
    <div className="flex h-full bg-canvas">
      <aside className="w-72 border-l border-line bg-surface flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-semibold tracking-tight">قنوات الفريق</h2>
          <p className="text-xs text-ink-subtle mt-0.5">{channels.length} قناة</p>
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {channels.map((ch) => {
            const isActive = activeId === ch.id;
            return (
              <li key={ch.id}>
                <button
                  onClick={() => setActiveId(ch.id)}
                  className={`w-full text-right px-5 py-2 text-sm transition ${
                    isActive
                      ? "bg-accent-soft text-accent-ink font-medium"
                      : "text-ink-muted hover:bg-surface-2"
                  }`}
                >
                  <span className="text-ink-subtle">#</span>{" "}
                  <span>{ch.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line p-3">
          <input
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="إضافة قناة..."
            onKeyDown={(e) => e.key === "Enter" && createChannel()}
            className="w-full px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            disabled={creatingChannel}
          />
        </div>
      </aside>

      {activeChannel ? (
        <div className="flex-1 flex flex-col">
          <div className="px-7 py-4 border-b border-line bg-surface">
            <div className="font-semibold tracking-tight">
              <span className="text-ink-subtle">#</span> {activeChannel.name}
            </div>
            {activeChannel.description && (
              <div className="text-xs text-ink-subtle mt-0.5">
                {activeChannel.description}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-ink-subtle text-sm pt-8">
                لا توجد رسائل في هذه القناة بعد
              </div>
            )}
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} users={users} />
            ))}
          </div>

          <div className="border-t border-line bg-surface p-4 flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`اكتب رسالة في #${activeChannel.name}...`}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-canvas border border-line focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              className="px-5 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition disabled:opacity-50 shadow-sm"
            >
              {sending ? "..." : "إرسال"}
            </button>
          </div>
          <div className="px-7 py-1.5 text-[11px] text-ink-subtle bg-surface border-t border-line/60">
            ترسل باسم {currentUser?.name ?? ""} · @ لذكر زميل
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-subtle">
          اختر قناة من اليمين
        </div>
      )}
    </div>
  );
}

function MessageRow({ message, users }: { message: TeamMessage; users: User[] }) {
  const author = users.find((u) => u.id === message.authorUserId);
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
        {(author?.name ?? "?")[0]}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-medium text-sm">{author?.name ?? "—"}</span>
          <span className="text-[11px] text-ink-subtle">
            {new Date(message.createdAt).toLocaleString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        </div>
        <div className="text-sm text-ink leading-7 whitespace-pre-wrap">
          {message.body}
        </div>
      </div>
    </div>
  );
}
