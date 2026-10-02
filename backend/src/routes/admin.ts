import { Router } from "express";
import { getProvider, getMockProvider } from "../providers";
import { listOrders } from "../services/orderStore";
import { Dish } from "../providers/types";
import { v4 as uuid } from "uuid";

const r = Router();

// Admin: overview + menu management (mock provider) + all orders
r.get("/overview", async (_req, res) => {
  const menu = await getProvider().getMenu();
  const orders = listOrders();
  res.json({
    restaurants: await getProvider().listRestaurants(),
    dishCount: menu.length,
    orderCount: orders.length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
    orders: orders.slice(0, 20),
  });
});

r.post("/dishes", async (req, res) => {
  const mock = getMockProvider();
  if (!mock) return res.status(400).json({ error: "Admin dish management only available with mock provider" });
  const d = req.body as Partial<Dish>;
  if (!d.name || !d.price || !d.restaurantId) return res.status(400).json({ error: "name, price, restaurantId required" });
  const dish: Dish = {
    id: "d" + uuid().slice(0, 6),
    restaurantId: d.restaurantId!,
    name: d.name!,
    description: d.description || "",
    price: Number(d.price),
    veg: !!d.veg,
    cuisine: d.cuisine || "Misc",
    tags: d.tags || [],
    rating: d.rating ?? 4.0,
    available: d.available ?? true,
  };
  mock.addDish(dish);
  res.status(201).json(dish);
});

r.patch("/dishes/:id", (req, res) => {
  const mock = getMockProvider();
  if (!mock) return res.status(400).json({ error: "Mock provider only" });
  res.json(mock.updateDish(req.params.id, req.body || {}));
});

r.delete("/dishes/:id", (req, res) => {
  const mock = getMockProvider();
  if (!mock) return res.status(400).json({ error: "Mock provider only" });
  res.json({ ok: mock.removeDish(req.params.id) });
});

export default r;
