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

export interface DevMe {
  merchantId: string;
  users: User[];
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
  bootstrap: () => request<DevMe>("/dev/me"),
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
};

export function setAuthIds(merchantId: string, userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("anvira:merchantId", merchantId);
  localStorage.setItem("anvira:userId", userId);
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
