import { Router } from "express";
import { handleChat } from "../services/agent";

const r = Router();

r.post("/", async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    if (!sessionId || !message) return res.status(400).json({ error: "sessionId and message required" });
    const out = await handleChat(String(sessionId), String(message));
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "chat failed" });
  }
});

export default r;
