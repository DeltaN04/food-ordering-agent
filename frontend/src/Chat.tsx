import { useEffect, useRef, useState } from "react";
import { api, sessionId, Dish } from "./api";

interface Msg { role: "user" | "bot"; text: string }

export default function Chat({ onCartChange, onOrder }: { onCartChange: () => void; onOrder: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Namaste! Try: 'veg biryani under 200' / 'recommend spicy' / 'add 2 momos' / 'checkout' / 'track my order'." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { ref.current?.scrollTo({ top: 99999 }); }, [msgs]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setLoading(true);
    try {
      const out = await api<{ replies: string[]; orderId?: string }>(`/api/chat`, {
        method: "POST",
        body: JSON.stringify({ sessionId, message }),
      });
      setMsgs((m) => [...m, ...out.replies.map((r) => ({ role: "bot" as const, text: r }))]);
      onCartChange();
      if (out.orderId) onOrder(out.orderId);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "bot", text: "Backend not reachable. Start it: cd food-ordering-agent/backend && npm install && npm run dev" }]);
    } finally { setLoading(false); }
  }

  const suggestions = ["menu", "veg under 150", "recommend spicy chicken", "add 2 masala dosa", "cart", "checkout", "track my order"];

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Chat ordering</h3>
      <div className="chatbox" ref={ref}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="msg bot">typing…</div>}
      </div>
      <div className="chips">
        {suggestions.map((s) => (
          <button key={s} className="ghost" onClick={() => send(s)}>{s}</button>
        ))}
      </div>
      <div className="row">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a craving or command…" />
        <button className="primary" onClick={() => send()}>Send</button>
      </div>
    </div>
  );
}

export function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  useEffect(() => {
    api<Dish[]>("/api/menu/dishes").then(setDishes).catch(() => {});
  }, []);
  return dishes;
}
