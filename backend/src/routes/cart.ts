import { Router } from "express";
import { getProvider } from "../providers";
import { getCart, setCart, clearCart } from "../services/cartStore";

const r = Router();

async function view(sessionId: string) {
  const menu = await getProvider().getMenu();
  const cart = getCart(sessionId);
  const items = cart.items
    .map((i) => ({ dish: menu.find((d) => d.id === i.dishId)!, qty: i.qty }))
    .filter((x) => x.dish);
  return { items, total: items.reduce((s, x) => s + x.dish.price * x.qty, 0) };
}

r.get("/:sessionId", async (req, res) => {
  res.json(await view(req.params.sessionId));
});

r.post("/:sessionId/add", async (req, res) => {
  const { dishId, qty = 1 } = req.body || {};
  if (!dishId) return res.status(400).json({ error: "dishId required" });
  const cart = getCart(req.params.sessionId);
  const ex = cart.items.find((i) => i.dishId === dishId);
  if (ex) ex.qty = Math.min(10, ex.qty + Number(qty));
  else cart.items.push({ dishId, qty: Math.min(10, Number(qty) || 1) });
  setCart(req.params.sessionId, cart.items);
  res.json(await view(req.params.sessionId));
});

r.post("/:sessionId/remove", async (req, res) => {
  const { dishId } = req.body || {};
  const cart = getCart(req.params.sessionId);
  setCart(req.params.sessionId, cart.items.filter((i) => i.dishId !== dishId));
  res.json(await view(req.params.sessionId));
});

r.post("/:sessionId/clear", async (req, res) => {
  clearCart(req.params.sessionId);
  res.json(await view(req.params.sessionId));
});

export default r;
