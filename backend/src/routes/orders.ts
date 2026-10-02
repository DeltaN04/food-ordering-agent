import { Router } from "express";
import { getProvider } from "../providers";
import { getCart } from "../services/cartStore";
import { createOrder, getOrder, latestOrderForSession, listOrders, updateOrder } from "../services/orderStore";
import { charge } from "../services/payment";

const r = Router();

r.post("/checkout/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { address = "Default address" } = req.body || {};
    const menu = await getProvider().getMenu();
    const cart = getCart(sessionId);
    if (!cart.items.length) return res.status(400).json({ error: "cart empty" });
    const items = cart.items.map((i) => {
      const d = menu.find((m) => m.id === i.dishId)!;
      return { dishId: d.id, name: d.name, price: d.price, qty: i.qty };
    });
    const total = items.reduce((s, x) => s + x.price * x.qty, 0);
    const pay = await charge({ amount: total, orderId: "pending" });
    const prov = await getProvider().placeOrder({ items: cart.items });
    const order = createOrder({
      sessionId, items, total, status: "placed",
      providerOrderId: prov.providerOrderId,
      paymentId: pay.paymentId, paymentStatus: pay.status, address,
    });
    const { clearCart } = await import("../services/cartStore");
    clearCart(sessionId);
    res.json(order);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/latest/:sessionId", (req, res) => {
  const o = latestOrderForSession(req.params.sessionId);
  if (!o) return res.status(404).json({ error: "no orders" });
  res.json(o);
});

r.get("/:id", (req, res) => {
  const o = getOrder(req.params.id);
  if (!o) return res.status(404).json({ error: "not found" });
  res.json(o);
});

r.get("/", (_req, res) => {
  res.json(listOrders());
});

r.patch("/:id", (req, res) => {
  const o = updateOrder(req.params.id, req.body || {});
  if (!o) return res.status(404).json({ error: "not found" });
  res.json(o);
});

export default r;
