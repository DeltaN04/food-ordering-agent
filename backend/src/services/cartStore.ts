export interface CartItem {
  dishId: string;
  qty: number;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  updatedAt: number;
}

const carts = new Map<string, Cart>();

export function getCart(sessionId: string): Cart {
  let c = carts.get(sessionId);
  if (!c) {
    c = { sessionId, items: [], updatedAt: Date.now() };
    carts.set(sessionId, c);
  }
  return c;
}

export function setCart(sessionId: string, items: CartItem[]): Cart {
  const c = { sessionId, items, updatedAt: Date.now() };
  carts.set(sessionId, c);
  return c;
}

export function clearCart(sessionId: string) {
  carts.set(sessionId, { sessionId, items: [], updatedAt: Date.now() });
}
