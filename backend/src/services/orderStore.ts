import { v4 as uuid } from "uuid";

export type OrderStatus = "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  sessionId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  providerOrderId?: string;
  paymentId?: string;
  paymentStatus: "pending" | "paid" | "failed";
  address?: string;
  createdAt: number;
  updatedAt: number;
}

const orders = new Map<string, Order>();
const bySession = new Map<string, string[]>();

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  placed: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

export function createOrder(o: Omit<Order, "id" | "createdAt" | "updatedAt">): Order {
  const order: Order = { ...o, id: "ord_" + uuid().slice(0, 8), createdAt: Date.now(), updatedAt: Date.now() };
  orders.set(order.id, order);
  const list = bySession.get(order.sessionId) || [];
  list.push(order.id);
  bySession.set(order.sessionId, list);
  // Simulate kitchen progression (mock). Real provider would webhook-update instead.
  advanceLater(order.id, 8_000);
  return order;
}

function advanceLater(orderId: string, delayMs: number) {
  setTimeout(() => {
    const o = orders.get(orderId);
    if (!o || o.status === "cancelled" || o.status === "delivered") return;
    const n = NEXT[o.status];
    if (n) {
      o.status = n;
      o.updatedAt = Date.now();
      if (n !== "delivered") advanceLater(orderId, 12_000);
    }
  }, delayMs);
  // Don't keep the process alive just for simulation
  const t = setTimeout(() => {}, 0);
  clearTimeout(t);
}

export function getOrder(id: string) {
  return orders.get(id);
}

export function latestOrderForSession(sessionId: string): Order | undefined {
  const list = bySession.get(sessionId) || [];
  if (!list.length) return undefined;
  return orders.get(list[list.length - 1]);
}

export function listOrders(): Order[] {
  return [...orders.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const o = orders.get(id);
  if (!o) return undefined;
  Object.assign(o, patch, { updatedAt: Date.now() });
  return o;
}
