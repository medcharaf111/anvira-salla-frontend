/**
 * Backend API client.
 *
 * Reads BACKEND_URL from server-side env, NEXT_PUBLIC_BACKEND_URL on client.
 * For the demo, the frontend identifies itself via X-Merchant-Id and
 * X-User-Id headers (read from localStorage on the client).
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8080";

export interface Merchant {
  id: string;
  name?: string;
  sallaStoreId?: string;
}

export interface User {
  id: string;
  name: string;
  role: "owner" | "agent";
  whatsappDisplayName: string | null;
  email?: string;
  active?: boolean;
}

export interface Conversation {
  id: string;
  merchantId: string;
  customerPhone: string;
  customerName: string | null;
  sallaCustomerId: string | null;
  assignedUserId: string | null;
  status: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: "in" | "out";
  body: string;
  whatsappMessageId: string | null;
  sentByUserId: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

export interface AbandonedCart {
  id: string;
  merchantId: string;
  sallaCartId: string;
  customerPhone: string | null;
  totalAmount: number | null;
  currency: string;
  recoveryMessageSentAt: string | null;
  recoveredAt: string | null;
  rawPayload: { products?: string[]; id?: string };
  createdAt: string;
}

export interface SallaOrder {
  id: string;
  merchantId: string;
  sallaOrderId: string;
  customerPhone: string | null;
  status: string;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantSummary {
  id: string;
  sallaStoreId: string;
  name: string;
  domain: string | null;
  isDemo: boolean;
  uninstalled?: boolean;
  installedAt?: string;
}

export interface DevMe {
  merchantId: string;
  merchant?: MerchantSummary;
  merchants?: MerchantSummary[];
  users: User[];
}

export interface Task {
  id: string;
  merchantId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  assignedUserId: string | null;
  createdByUserId: string | null;
  conversationId: string | null;
  sallaOrderId: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CustomerSummary {
  phone: string;
  name: string | null;
  conversationCount: number;
  lastSeen: string;
}

export interface CustomerNote {
  id: string;
  merchantId: string;
  customerPhone: string;
  body: string;
  authorUserId: string | null;
  createdAt: string;
}

export interface CustomerProfile {
  phone: string;
  name: string | null;
  conversations: Conversation[];
  orders: SallaOrder[];
  notes: CustomerNote[];
}

export interface ActivityEntry {
  id: string;
  merchantId: string;
  actorUserId: string | null;
  action: string;
  targetKind: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface TeamChannel {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  kind: "channel" | "dm";
  createdAt: string;
}

export interface TeamMessage {
  id: string;
  channelId: string;
  authorUserId: string;
  body: string;
  mentions: string[] | null;
  createdAt: string;
}

export interface WorkflowTemplate {
  id: string;
  merchantId: string;
  slug: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  enabled: boolean;
  createdAt: string;
}

export interface SentimentReport {
  counts: { positive: number; neutral: number; negative: number };
  perConversation: Record<string, "positive" | "neutral" | "negative">;
  source: "gemini" | "fallback";
  sample: number;
}

export interface AgentPerformance {
  userId: string;
  name: string;
  role: string;
  messagesSent: number;
  aiAssisted: number;
}

export interface CustomWorkflow {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  nodes: Array<{
    id: string;
    type: "trigger" | "condition" | "action";
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{ id: string; source: string; target: string }>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  merchantId: string;
  question: string;
  answer: string;
  tags: string[];
  enabled: boolean;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  merchantId: string;
  userId: string;
  name: string;
  keyPreview: string;
  lastUsedAt: string | null;
  callCount: number;
  revokedAt: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  merchantId: string;
  userId: string | null;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface OrderDetail {
  order: SallaOrder;
  tasks: Task[];
  conversations: Conversation[];
  timeline: Array<{
    label: string;
    at: string;
    status: "done" | "active" | "pending";
  }>;
}

export interface ActivityResponse {
  entries: ActivityEntry[];
  distinctActions: string[];
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const merchantId = localStorage.getItem("anvira:merchantId");
  const userId = localStorage.getItem("anvira:userId");
  const headers: Record<string, string> = {};
  if (merchantId) headers["X-Merchant-Id"] = merchantId;
  if (userId) headers["X-User-Id"] = userId;
  return headers;
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  bootstrap: (merchantId?: string) =>
    request<DevMe>(`/dev/me${merchantId ? `?merchantId=${merchantId}` : ""}`),
  listConversations: () =>
    request<{ conversations: Conversation[] }>("/conversations"),
  getConversation: (id: string) =>
    request<{ conversation: Conversation; messages: Message[] }>(
      `/conversations/${id}`
    ),
  sendMessage: (id: string, body: string, aiGenerated = false) =>
    request<{ ok: boolean; message: Message; whatsapp: { mock: boolean } }>(
      `/conversations/${id}/messages`,
      { method: "POST", body: JSON.stringify({ body, aiGenerated }) }
    ),
  assignConversation: (id: string, userId: string | null) =>
    request<{ ok: boolean; conversation: Conversation }>(
      `/conversations/${id}/assign`,
      { method: "POST", body: JSON.stringify({ userId }) }
    ),
  suggestReplies: (id: string) =>
    request<{ suggestions: string[]; source: "gemini" | "fallback" }>(
      `/conversations/${id}/suggest-replies`
    ),
  simulateInbound: (
    body: string,
    opts: { conversationId?: string; customerPhone?: string; customerName?: string }
  ) =>
    request<{ ok: boolean; conversationId: string; message: Message }>(
      "/dev/whatsapp/simulate-inbound",
      { method: "POST", body: JSON.stringify({ body, ...opts }) }
    ),
  simulateInboundConversation: () =>
    request<{ ok: boolean; conversation: Conversation; message: Message }>(
      "/dev/simulate/inbound-conversation",
      { method: "POST" }
    ),
  simulateOrder: () =>
    request<{ ok: boolean; order: SallaOrder }>("/dev/simulate/order", {
      method: "POST",
    }),
  simulateAbandonedCart: () =>
    request<{ ok: boolean; cart: AbandonedCart }>("/dev/simulate/abandoned-cart", {
      method: "POST",
    }),
  listCarts: () => request<{ carts: AbandonedCart[] }>("/abandoned-carts"),
  recoverCart: (id: string) =>
    request<{
      ok: boolean;
      draft: string;
      aiSource: "gemini" | "fallback";
      whatsapp: { mock: boolean; messageId: string };
      conversationId: string;
    }>(`/abandoned-carts/${id}/recover`, { method: "POST" }),
  listOrders: () => request<{ orders: SallaOrder[] }>("/orders"),
  listUsers: () => request<{ users: User[] }>("/users"),
  createUser: (
    payload: Partial<User> & { name: string; email: string; role?: "owner" | "agent" }
  ) =>
    request<{ ok: boolean; user: User }>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, payload: Partial<User>) =>
    request<{ ok: boolean; user: User }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // ---------- Tasks ----------
  listTasks: () => request<{ tasks: Task[] }>("/tasks"),
  createTask: (payload: {
    title: string;
    description?: string;
    status?: "todo" | "in_progress" | "done";
    assignedUserId?: string | null;
    conversationId?: string | null;
  }) =>
    request<{ ok: boolean; task: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTask: (id: string, payload: Partial<Task>) =>
    request<{ ok: boolean; task: Task }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),

  // ---------- Customers ----------
  listCustomers: () =>
    request<{ customers: CustomerSummary[] }>("/customers"),
  getCustomer: (phone: string) =>
    request<CustomerProfile>(`/customers/${encodeURIComponent(phone)}`),
  addCustomerNote: (phone: string, body: string) =>
    request<{ ok: boolean; note: CustomerNote }>(
      `/customers/${encodeURIComponent(phone)}/notes`,
      { method: "POST", body: JSON.stringify({ body }) }
    ),
  deleteCustomerNote: (phone: string, id: string) =>
    request<{ ok: boolean }>(
      `/customers/${encodeURIComponent(phone)}/notes/${id}`,
      { method: "DELETE" }
    ),

  // ---------- Activity ----------
  listActivity: (params?: { actor?: string; action?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.actor) q.set("actor", params.actor);
    if (params?.action) q.set("action", params.action);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const qs = q.toString();
    return request<ActivityResponse>(`/activity${qs ? `?${qs}` : ""}`);
  },
  exportActivityUrl: (params?: { actor?: string; action?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.actor) q.set("actor", params.actor);
    if (params?.action) q.set("action", params.action);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    return `${BACKEND_URL}/activity/export?${q.toString()}`;
  },

  // ---------- Team chat ----------
  listChannels: () =>
    request<{ channels: TeamChannel[] }>("/team/channels"),
  createChannel: (name: string, description?: string) =>
    request<{ ok: boolean; channel: TeamChannel }>("/team/channels", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  getChannel: (id: string) =>
    request<{ channel: TeamChannel; messages: TeamMessage[] }>(
      `/team/channels/${id}/messages`
    ),
  postChannelMessage: (id: string, body: string) =>
    request<{ ok: boolean; message: TeamMessage }>(
      `/team/channels/${id}/messages`,
      { method: "POST", body: JSON.stringify({ body }) }
    ),

  // ---------- Workflows ----------
  listWorkflows: () =>
    request<{ workflows: WorkflowTemplate[] }>("/workflows"),
  toggleWorkflow: (id: string, enabled: boolean) =>
    request<{ ok: boolean; workflow: WorkflowTemplate }>(`/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),

  // ---------- AI Insights ----------
  insightsSentiment: () =>
    request<SentimentReport>("/insights/sentiment"),
  insightsTopQuestions: () =>
    request<{ questions: string[]; source: "gemini" | "fallback" }>(
      "/insights/top-questions"
    ),
  insightsAgents: () =>
    request<{ agents: AgentPerformance[] }>("/insights/agent-performance"),
  insightsPeakHours: () =>
    request<{ buckets: number[] }>("/insights/peak-hours"),
  summarizeConversation: (id: string) =>
    request<{ text: string; source: "gemini" | "fallback" }>(
      `/insights/conversations/${id}/summary`,
      { method: "POST" }
    ),

  // ---------- Order detail ----------
  getOrder: (id: string) => request<OrderDetail>(`/orders/${id}`),

  // ---------- Custom workflows (visual builder) ----------
  listCustomWorkflows: () =>
    request<{ workflows: CustomWorkflow[] }>("/custom-workflows"),
  getCustomWorkflow: (id: string) =>
    request<{ workflow: CustomWorkflow }>(`/custom-workflows/${id}`),
  createCustomWorkflow: (payload: { name: string; description?: string }) =>
    request<{ ok: boolean; workflow: CustomWorkflow }>("/custom-workflows", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCustomWorkflow: (id: string, payload: Partial<CustomWorkflow>) =>
    request<{ ok: boolean; workflow: CustomWorkflow }>(`/custom-workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCustomWorkflow: (id: string) =>
    request<{ ok: boolean }>(`/custom-workflows/${id}`, { method: "DELETE" }),

  // ---------- Knowledge base ----------
  listKnowledge: () => request<{ entries: KnowledgeEntry[] }>("/knowledge"),
  createKnowledge: (payload: { question: string; answer: string; tags?: string[] }) =>
    request<{ ok: boolean; entry: KnowledgeEntry }>("/knowledge", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateKnowledge: (id: string, payload: Partial<KnowledgeEntry>) =>
    request<{ ok: boolean; entry: KnowledgeEntry }>(`/knowledge/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteKnowledge: (id: string) =>
    request<{ ok: boolean }>(`/knowledge/${id}`, { method: "DELETE" }),

  // ---------- API keys ----------
  listApiKeys: () => request<{ keys: ApiKey[] }>("/api-keys"),
  createApiKey: (name: string) =>
    request<{ ok: boolean; key: ApiKey; plaintext: string }>("/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  revokeApiKey: (id: string) =>
    request<{ ok: boolean }>(`/api-keys/${id}`, { method: "DELETE" }),

  // ---------- Notifications ----------
  listNotifications: () =>
    request<{ notifications: AppNotification[]; unreadCount: number }>("/notifications"),
  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),
};

export function setAuthIds(merchantId: string, userId: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem("anvira:merchantId", merchantId);
  if (userId) {
    localStorage.setItem("anvira:userId", userId);
  } else {
    localStorage.removeItem("anvira:userId");
  }
}

export function setStoredMerchantId(merchantId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("anvira:merchantId", merchantId);
}

export function getStoredAuth(): { merchantId: string | null; userId: string | null } {
  if (typeof window === "undefined") {
    return { merchantId: null, userId: null };
  }
  return {
    merchantId: localStorage.getItem("anvira:merchantId"),
    userId: localStorage.getItem("anvira:userId"),
  };
}
