import { Router } from "express";
import { getProvider } from "../providers";

const r = Router();

r.get("/restaurants", async (_req, res) => {
  try { res.json(await getProvider().listRestaurants()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/dishes", async (req, res) => {
  try {
    const { restaurantId, q } = req.query;
    const p = getProvider();
    if (q) res.json(await p.searchDishes(String(q)));
    else res.json(await p.getMenu(restaurantId ? String(restaurantId) : undefined));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default r;
