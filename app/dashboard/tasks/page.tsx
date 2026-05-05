"use client";

import { useEffect, useState } from "react";
import { api, type Task, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const COLUMNS: { id: Task["status"]; title: string; emoji: string }[] = [
  { id: "todo", title: "للتنفيذ", emoji: "📋" },
  { id: "in_progress", title: "قيد التنفيذ", emoji: "🔄" },
  { id: "done", title: "منجز", emoji: "✓" },
];

export default function TasksPage() {
  const { merchantId, users, currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("");

  async function load() {
    const r = await api.listTasks();
    setTasks(r.tasks);
  }

  useEffect(() => {
    if (!merchantId) return;
    load().catch(console.error);
  }, [merchantId]);

  async function createTask() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.createTask({
        title: newTitle.trim(),
        assignedUserId: newAssignee || currentUser?.id || null,
      });
      setNewTitle("");
      setNewAssignee("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task: Task, status: Task["status"]) {
    await api.updateTask(task.id, { status });
    await load();
  }

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">المهام</p>
        <h1 className="text-3xl font-semibold tracking-tight">لوحة المهام</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          نظّم عمل الفريق بطريقة Kanban. اضغط على المهمة لنقلها بين الأعمدة.
        </p>
      </header>

      <div className="bg-surface border border-line rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="مهمة جديدة (اضغط Enter للإضافة)"
          onKeyDown={(e) => e.key === "Enter" && createTask()}
          className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <select
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          className="px-3 py-2 rounded-lg bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        >
          <option value="">إسناد إليّ</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <button
          onClick={createTask}
          disabled={creating || !newTitle.trim()}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
        >
          {creating ? "..." : "إضافة"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="bg-surface-2/40 rounded-2xl border border-line p-3 min-h-[300px]"
            >
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="font-semibold text-sm tracking-tight">
                  {col.emoji} {col.title}
                </h3>
                <span className="text-xs text-ink-subtle">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    onMove={moveTask}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center text-ink-subtle text-xs py-6">
                    لا توجد مهام
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  users,
  onMove,
}: {
  task: Task;
  users: User[];
  onMove: (t: Task, s: Task["status"]) => Promise<void>;
}) {
  const assignee = users.find((u) => u.id === task.assignedUserId);
  const next: Record<Task["status"], Task["status"] | null> = {
    todo: "in_progress",
    in_progress: "done",
    done: "todo",
  };
  const nextLabel: Record<Task["status"], string> = {
    todo: "← بدء",
    in_progress: "← إنهاء",
    done: "← فتح",
  };

  return (
    <div className="bg-surface border border-line rounded-xl p-3 hover:border-line-strong transition">
      <div className="text-sm font-medium mb-1">{task.title}</div>
      {task.description && (
        <div className="text-xs text-ink-muted mb-2 leading-6">{task.description}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-ink-subtle flex items-center gap-1.5">
          {assignee && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-soft text-accent-ink">
              {assignee.name.split(" ")[0]}
            </span>
          )}
          {task.sallaOrderId && (
            <span className="font-mono">#{task.sallaOrderId}</span>
          )}
        </div>
        {next[task.status] && (
          <button
            onClick={() => onMove(task, next[task.status]!)}
            className="text-[11px] text-accent hover:underline"
          >
            {nextLabel[task.status]}
          </button>
        )}
      </div>
    </div>
  );
}
