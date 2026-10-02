import { getProvider } from "../providers";
import { Dish } from "../providers/types";
import { getCart, setCart, clearCart } from "./cartStore";
import { createOrder, latestOrderForSession } from "./orderStore";
import { charge } from "./payment";
import { parsePrefs, recommend } from "./recommender";
import { dishes as seedDishes } from "../data/seed";

export interface ChatResponse {
  replies: string[];
  intent: string;
  cart?: { items: { dish: Dish; qty: number }[]; total: number };
  orderId?: string;
  recommendations?: Dish[];
}

function dishById(id: string, all: Dish[]): Dish | undefined {
  return all.find((d) => d.id === id);
}

function findDishByName(text: string, all: Dish[]): Dish | undefined {
  const t = text.toLowerCase();
  // longest-name match first to prefer "chicken dum biryani" over "biryani"
  const sorted = [...all].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((d) => t.includes(d.name.toLowerCase()) || d.tags.some((tag) => t.includes(tag) && tag.length > 3));
}

function parseQty(text: string): number {
  const m = text.match(/(\d+)\s*(x|plate|portion|qty|nos)?/i);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 10) return n;
  }
  if (/two|double|2x/i.test(text)) return 2;
  return 1;
}

async function cartView(sessionId: string) {
  const provider = getProvider();
  const menu = await provider.getMenu();
  const cart = getCart(sessionId);
  const items = cart.items
    .map((i) => ({ dish: dishById(i.dishId, menu)!, qty: i.qty }))
    .filter((x) => x.dish);
  const total = items.reduce((s, x) => s + x.dish.price * x.qty, 0);
  return { items, total };
}

export async function handleChat(sessionId: string, message: string): Promise<ChatResponse> {
  const provider = getProvider();
  const text = message.trim();
  const t = text.toLowerCase();
  const menu = await provider.getMenu();

  // --- intents ---
  if (/^(hi|hello|hey|namaste)\b/.test(t)) {
    return {
      intent: "greet",
      replies: [
        `Namaste! I'm your food ordering assistant. Tell me a craving — e.g. "veg biryani under 200" — or type "menu" to browse.`,
      ],
    };
  }

  if (/track|where.*order|order.*status|status/.test(t)) {
    const o = latestOrderForSession(sessionId);
    if (!o) return { intent: "track_empty", replies: [`No orders yet on this session. Add something — e.g. "add 2 masala dosa" — then checkout.`] };
    return {
      intent: "track",
      orderId: o.id,
      replies: [`Order ${o.id}: ${o.status.replace(/_/g, " ")} · ₹${o.total} · ${o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}.`],
    };
  }

  if (/menu|show.*food|what.*available|restaurants/.test(t)) {
    const top = menu.slice(0, 8);
    return {
      intent: "menu",
      replies: [`Here's a taste of the menu:\n${top.map((d) => `• ${d.name} — ₹${d.price} (${d.veg ? "veg" : "non-veg"})`).join("\n")}\nSay "add <dish>" to add, or "recommend ..." for picks.`],
      recommendations: top.slice(0, 3),
    };
  }

  if (/recommend|suggest|best|hungry|craving|something/.test(t)) {
    const prefs = parsePrefs(t);
    const recs = recommend(menu, prefs, 3);
    if (!recs.length) return { intent: "recommend_empty", replies: [`Nothing matched. Try "veg under 150" or "spicy chicken".`] };
    return {
      intent: "recommend",
      recommendations: recs.map((r) => r.dish),
      replies: [`Top picks for you:\n${recs.map((r, i) => `${i + 1}. ${r.dish.name} — ₹${r.dish.price} (${r.reason})`).join("\n")}\nSay "add <name>" to add to cart.`],
    };
  }

  if (/remov|delete|clear cart/.test(t)) {
    if (/clear/.test(t)) {
      clearCart(sessionId);
      return { intent: "cart_clear", replies: [`Cart cleared. What next?`] };
    }
    const d = findDishByName(t, menu);
    const cart = getCart(sessionId);
    if (d) {
      setCart(sessionId, cart.items.filter((i) => i.dishId !== d.id));
      const view = await cartView(sessionId);
      return { intent: "cart_remove", cart: view, replies: [`Removed ${d.name}. Cart total ₹${view.total}.`] };
    }
    return { intent: "cart_remove_miss", replies: [`Which item? Say "remove masala dosa".`] };
  }

  if (/\bcart\b|\bbill\b|\btotal\b|show.*order/.test(t)) {
    const view = await cartView(sessionId);
    if (!view.items.length) return { intent: "cart_empty", replies: [`Cart is empty. Try "add chicken biryani".`] };
    return {
      intent: "cart_view",
      cart: view,
      replies: [`Cart:\n${view.items.map((x) => `• ${x.qty}x ${x.dish.name} — ₹${x.dish.price * x.qty}`).join("\n")}\nTotal ₹${view.total}. Say "checkout" to place the order.`],
    };
  }

  // Browse-by-preference BEFORE add: "veg biryani under 200" should filter, not add.
  if (/price|cost|cheap|expensive|\bveg\b|non-?veg|under \d+|below \d+|budget/.test(t) && !/\badd\b|\bwant\b|get me|buy\b/.test(t)) {
    const prefs = parsePrefs(t);
    const recs = recommend(menu, prefs, 3);
    return {
      intent: "filter",
      recommendations: recs.map((r) => r.dish),
      replies: [`Matching dishes:\n${recs.map((r) => `• ${r.dish.name} — ₹${r.dish.price} (${r.dish.veg ? "veg" : "non-veg"})`).join("\n") || "none"}\nSay "add <name>".`],
    };
  }

  if (/\badd\b|\bwant\b|get me|buy\b|i'll have|\border\b/i.test(t)) {
    const d = findDishByName(t, menu);
    if (!d) {
      // fall through to search suggestions
      const results = await provider.searchDishes(text);
      if (results.length) {
        return {
          intent: "search",
          recommendations: results.slice(0, 3),
          replies: [`Did you mean:\n${results.slice(0, 3).map((r) => `• ${r.name} — ₹${r.price}`).join("\n")}\nSay "add <name>".`],
        };
      }
      return { intent: "add_miss", replies: [`Couldn't find "${text}". Try "menu" or "recommend spicy".`] };
    }
    const qty = parseQty(t);
    const cart = getCart(sessionId);
    const ex = cart.items.find((i) => i.dishId === d.id);
    if (ex) ex.qty = Math.min(10, ex.qty + qty);
    else cart.items.push({ dishId: d.id, qty });
    setCart(sessionId, cart.items);
    const view = await cartView(sessionId);
    return { intent: "add", cart: view, replies: [`Added ${qty}x ${d.name} (₹${d.price * qty}). Cart total ₹${view.total}. Say "checkout" when ready.`] };
  }

  if (/\bcheckout\b|place.*order|\bpay for\b|\bconfirm order\b/.test(t)) {
    const view = await cartView(sessionId);
    if (!view.items.length) return { intent: "checkout_empty", replies: [`Cart is empty — add something first, e.g. "add veg biryani".`] };
    const addressMatch = text.match(/deliver to (.+)/i) || text.match(/address[:\s]+(.+)/i);
    const address = addressMatch ? addressMatch[1] : "Default address";
    const total = view.total;
    const pay = await charge({ amount: total, orderId: "pending" });
    const prov = await provider.placeOrder({ items: view.items.map((x) => ({ dishId: x.dish.id, qty: x.qty })) });
    const order = createOrder({
      sessionId,
      items: view.items.map((x) => ({ dishId: x.dish.id, name: x.dish.name, price: x.dish.price, qty: x.qty })),
      total,
      status: "placed",
      providerOrderId: prov.providerOrderId,
      paymentId: pay.paymentId,
      paymentStatus: pay.status,
      address,
    });
    clearCart(sessionId);
    return {
      intent: "checkout",
      orderId: order.id,
      replies: [
        `Order ${order.id} placed! ₹${total} (${pay.status}) → ${address}.\n${order.items.map((i) => `• ${i.qty}x ${i.name}`).join("\n")}\nETA ~${prov.etaMins} min. Say "track my order" anytime.`,
      ],
    };
  }

  // default: keyword search
  const results = await provider.searchDishes(text);
  if (results.length) {
    return {
      intent: "search",
      recommendations: results.slice(0, 3),
      replies: [`Found:\n${results.slice(0, 3).map((r) => `• ${r.name} — ₹${r.price}`).join("\n")}\nSay "add <name>" or "recommend ...".`],
    };
  }
  void seedDishes;
  return {
    intent: "fallback",
    replies: [`I can help with menu, recommendations, cart & orders. Try: "veg biryani under 200", "add 2 momos", "cart", "checkout", "track my order".`],
  };
}
