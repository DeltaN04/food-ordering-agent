import { useEffect, useState } from "react";
import { api, sessionId, Dish } from "./api";

interface CartView { items: { dish: Dish; qty: number }[]; total: number }

export function useCart(refreshKey: number) {
  const [cart, setCart] = useState<CartView>({ items: [], total: 0 });
  useEffect(() => {
    api<CartView>(`/api/cart/${sessionId}`).then(setCart).catch(() => {});
  }, [refreshKey]);
  return { cart, setCart };
}

export default function MenuPanel({ refreshKey, onChange }: { refreshKey: number; onChange: () => void }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [q, setQ] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    api<Dish[]>(`/api/menu/dishes${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setDishes).catch(() => {});
  }, [q, refreshKey]);

  const filtered = dishes.filter((d) => (!vegOnly || d.veg));

  async function add(id: string) {
    await api(`/api/cart/${sessionId}/add`, { method: "POST", body: JSON.stringify({ dishId: id, qty: 1 }) });
    onChange();
  }

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Menu</h3>
      <div className="row" style={{ marginBottom: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search biryani, momos, paneer…" />
        <button className={vegOnly ? "primary" : "ghost"} onClick={() => setVegOnly(!vegOnly)}>Veg</button>
      </div>
      {filtered.map((d) => (
        <div key={d.id} className="dish">
          <div>
            <div><span className={d.veg ? "veg" : "nonveg"}>{d.veg ? "VEG" : "NON-VEG"}</span> <b>{d.name}</b> — ₹{d.price}</div>
            <div className="muted">{d.description} · ⭐{d.rating}</div>
          </div>
          <button className="ghost" onClick={() => add(d.id)}>Add</button>
        </div>
      ))}
      {!filtered.length && <div className="muted">No dishes — is the backend running on :4001?</div>}
    </div>
  );
}

export function CartPanel({ cart, onChange, onOrder }: { cart: CartView; onChange: () => void; onOrder: (id: string) => void }) {
  const [address, setAddress] = useState("HSR Layout, Bengaluru");

  async function checkout() {
    const o = await api<{ id: string }>(`/api/orders/checkout/${sessionId}`, {
      method: "POST", body: JSON.stringify({ address }),
    });
    onChange();
    onOrder(o.id);
  }

  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Cart · ₹{cart.total}</h3>
      {!cart.items.length && <div className="muted">Empty. Add from menu or chat.</div>}
      {cart.items.map((x) => (
        <div key={x.dish.id} className="dish">
          <span>{x.qty}x {x.dish.name}</span>
          <span>₹{x.dish.price * x.qty} <button className="ghost" onClick={async () => {
            await api(`/api/cart/${sessionId}/remove`, { method: "POST", body: JSON.stringify({ dishId: x.dish.id }) });
            onChange();
          }}>✕</button></span>
        </div>
      ))}
      {!!cart.items.length && (
        <>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" style={{ marginTop: 8 }} />
          <button className="primary" style={{ width: "100%", marginTop: 8 }} onClick={checkout}>Checkout · ₹{cart.total}</button>
        </>
      )}
    </div>
  );
}

export function TrackPanel({ orderId }: { orderId: string | null }) {
  const [order, setOrder] = useState<any>(null);
  useEffect(() => {
    if (!orderId) return;
    const load = () => api(`/api/orders/${orderId}`).then(setOrder).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [orderId]);
  if (!orderId) return <div className="card muted">No order yet — checkout to track here.</div>;
  if (!order) return <div className="card">Loading {orderId}…</div>;
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Order {order.id}</h3>
      <div>Status: <span className="status">{order.status.replaceAll("_", " ")}</span> · Payment: {order.paymentStatus}</div>
      <div className="muted">{order.items.map((i: any) => `${i.qty}x ${i.name}`).join(", ")} · ₹{order.total}</div>
      <div className="muted">Auto-refreshes every 5s. Kitchen simulation advances placed → confirmed → preparing → out → delivered.</div>
    </div>
  );
}

export function AdminPanel() {
  const [data, setData] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", restaurantId: "r1", veg: true });
  function load() { api("/api/admin/overview").then(setData).catch(() => {}); }
  useEffect(load, []);
  if (!data) return <div className="card muted">Admin: start backend to see revenue/orders.</div>;
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Admin</h3>
      <div className="muted">Dishes: {data.dishCount} · Orders: {data.orderCount} · Revenue: ₹{data.revenue}</div>
      <div className="row" style={{ margin: "8px 0" }}>
        <input placeholder="Dish name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <select value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}>
          {data.restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="primary" onClick={async () => {
          await api("/api/admin/dishes", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price) }) });
          setForm({ name: "", price: "", restaurantId: "r1", veg: true });
          load();
        }}>Add dish</button>
      </div>
      <table>
        <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {data.orders.map((o: any) => (
            <tr key={o.id}><td>{o.id}</td><td>{o.items.map((i: any) => `${i.qty}x ${i.name}`).join(", ")}</td><td>₹{o.total}</td><td>{o.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
