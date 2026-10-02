import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat";
import menuRoutes from "./routes/menu";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import adminRoutes from "./routes/admin";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "food-ordering-agent" }));
  app.use("/api/chat", chatRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}
