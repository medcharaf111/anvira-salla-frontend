"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { api, type CustomWorkflow } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type NodeKind = "trigger" | "condition" | "action";

const NODE_PALETTE: {
  kind: NodeKind;
  label: string;
  variants: { value: string; label: string }[];
}[] = [
  {
    kind: "trigger",
    label: "البادئ (متى يشتغل)",
    variants: [
      { value: "salla.abandoned_cart", label: "ترك سلة بدون إكمال" },
      { value: "salla.order_completed", label: "إتمام طلب" },
      { value: "salla.order_paid", label: "دفع طلب" },
      { value: "whatsapp.message_received", label: "وصول رسالة واتساب" },
      { value: "schedule", label: "موعد دوري (cron)" },
    ],
  },
  {
    kind: "condition",
    label: "شرط (تحقّق من...)",
    variants: [
      { value: "filter.tag", label: "تاج العميل = ..." },
      { value: "filter.amount_gt", label: "قيمة الطلب > ..." },
      { value: "filter.time_window", label: "في نطاق وقت محدد" },
      { value: "ai.intent", label: "نية العميل (AI)" },
      { value: "ai.sentiment", label: "نبرة العميل (AI)" },
    ],
  },
  {
    kind: "action",
    label: "إجراء (افعل...)",
    variants: [
      { value: "whatsapp.send_template", label: "أرسل قالب واتساب" },
      { value: "whatsapp.send_ai_reply", label: "أرسل رد AI" },
      { value: "tasks.create", label: "أنشئ مهمة" },
      { value: "ai.summarize_thread", label: "لخّص المحادثة" },
      { value: "salla.update_order_status", label: "حدّث حالة طلب سلة" },
      { value: "team.notify_channel", label: "إشعار قناة فريق" },
    ],
  },
];

export default function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ReactFlowProvider>
      <Builder id={id} />
    </ReactFlowProvider>
  );
}

function Builder({ id }: { id: string }) {
  const { merchantId, currentUser } = useAuth();
  const [workflow, setWorkflow] = useState<CustomWorkflow | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    if (!merchantId) return;
    api.getCustomWorkflow(id).then((r) => {
      setWorkflow(r.workflow);
      setName(r.workflow.name);
      setDescription(r.workflow.description ?? "");
      setEnabled(r.workflow.enabled);
      setNodes(
        (r.workflow.nodes as unknown as Node[]).map((n) => ({
          ...n,
          type: n.type ?? "default",
        }))
      );
      setEdges(r.workflow.edges as unknown as Edge[]);
    });
  }, [id, merchantId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  function addNode(kind: NodeKind, variant: { value: string; label: string }) {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNode: Node = {
      id,
      type: kind,
      position: { x: 240 + Math.random() * 60, y: 80 + nodes.length * 110 },
      data: { kind: variant.value, label: variant.label },
    };
    setNodes((nds) => [...nds, newNode]);
  }

  async function save() {
    setSaving(true);
    try {
      await api.updateCustomWorkflow(id, {
        name,
        description: description || null,
        nodes: nodes as never,
        edges: edges as never,
        enabled,
      });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("حذف الأتمتة؟ لا يمكن التراجع.")) return;
    await api.deleteCustomWorkflow(id);
    window.location.href = "/dashboard/workflows";
  }

  const nodeTypes = useMemo(
    () => ({
      trigger: FlowNode,
      condition: FlowNode,
      action: FlowNode,
    }),
    []
  );

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full text-ink-subtle">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-canvas">
      <aside className="w-72 border-l border-line bg-surface flex flex-col shrink-0 overflow-y-auto">
        <div className="px-5 py-4 border-b border-line">
          <Link href="/dashboard/workflows" className="text-xs text-ink-subtle hover:text-ink mb-2 inline-block">
            ← العودة للأتمتات
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full font-semibold tracking-tight bg-transparent text-base focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر..."
            rows={2}
            className="w-full text-xs text-ink-muted bg-transparent mt-1 resize-none focus:outline-none"
          />
        </div>

        <div className="px-4 py-4 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-subtle">الحالة</span>
            <button
              onClick={() => isOwner && setEnabled(!enabled)}
              disabled={!isOwner}
              className={`w-12 h-6 rounded-full transition relative ${
                enabled ? "bg-accent" : "bg-surface-3"
              } ${!isOwner ? "opacity-50" : ""}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                  enabled ? "right-0.5" : "right-[1.625rem]"
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-ink-subtle">
            {enabled ? "✓ هذه الأتمتة مفعّلة" : "متوقفة — فعّلها بعد الانتهاء من البناء"}
          </p>
        </div>

        <div className="flex-1 px-4 py-3 overflow-y-auto">
          {NODE_PALETTE.map((group) => (
            <div key={group.kind} className="mb-4">
              <div className={`text-[10px] uppercase tracking-wider mb-2 ${
                group.kind === "trigger" ? "text-info" :
                group.kind === "condition" ? "text-warn" :
                "text-success"
              }`}>
                {group.label}
              </div>
              <div className="space-y-1">
                {group.variants.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => addNode(group.kind, v)}
                    className="w-full text-right text-xs px-3 py-2 rounded-lg bg-canvas border border-line hover:border-accent hover:bg-accent-soft/30 transition"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line p-3 space-y-2">
          <button
            onClick={save}
            disabled={saving}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? "...جاري الحفظ" : "حفظ"}
          </button>
          {savedAt && (
            <p className="text-[11px] text-success-soft text-center">
              حُفظ {savedAt.toLocaleTimeString("ar-SA")}
            </p>
          )}
          <button
            onClick={remove}
            className="w-full px-4 py-1.5 rounded-lg bg-surface-2 text-danger text-xs hover:bg-danger-soft transition"
          >
            حذف الأتمتة
          </button>
        </div>
      </aside>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color="#e7e6ee" />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            nodeColor={(n) =>
              n.type === "trigger" ? "#0284c7" :
              n.type === "condition" ? "#d97706" :
              "#16a34a"
            }
            maskColor="rgba(245,244,249,0.7)"
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center max-w-sm">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-semibold mb-1">ابدأ ببناء أتمتتك</h3>
              <p className="text-sm text-ink-muted leading-7">
                اختر <span className="text-info">"بادئ"</span> من القائمة اليمنى لتحدد متى تشتغل،
                ثم أضف <span className="text-success">"إجراء"</span> لتحدد ماذا تفعل.
                اربطهم بسحب خط بينهم.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FlowNode({ data, type }: NodeProps) {
  const colors: Record<string, { bg: string; label: string }> = {
    trigger: { bg: "bg-info-soft", label: "بادئ" },
    condition: { bg: "bg-warn-soft", label: "شرط" },
    action: { bg: "bg-success-soft", label: "إجراء" },
  };
  const c = colors[type as string] ?? colors.action;
  const isTrigger = type === "trigger";

  return (
    <div className={`${c.bg} px-4 py-3 rounded-xl border border-line shadow-sm min-w-[200px] relative`}>
      {/* Triggers don't accept incoming connections */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !bg-ink-subtle !border-0"
        />
      )}
      <div className="text-[10px] uppercase tracking-wider mb-1 opacity-70">
        {c.label}
      </div>
      <div className="text-sm font-medium text-ink leading-6">
        {String(data.label ?? "—")}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-ink-subtle !border-0"
      />
    </div>
  );
}
