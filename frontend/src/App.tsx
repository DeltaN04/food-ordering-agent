import { useState } from "react";
import Chat from "./Chat";
import MenuPanel, { CartPanel, TrackPanel, AdminPanel, useCart } from "./panels";
import "./styles.css";

export default function App() {
  const [tab, setTab] = useState<"order" | "track" | "admin">("order");
  const [refreshKey, setRefreshKey] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { cart } = useCart(refreshKey);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app">
      <div className="header">
        <h1>🍛 Food Ordering Agent</h1>
        <span className="muted">mock provider · mock payments · Stripe-ready</span>
      </div>
      <div className="tabs">
        <button className={tab === "order" ? "active" : ""} onClick={() => setTab("order")}>Order</button>
        <button className={tab === "track" ? "active" : ""} onClick={() => setTab("track")}>Track {orderId ? `(${orderId})` : ""}</button>
        <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>Admin</button>
      </div>
      {tab === "order" && (
        <div className="grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Chat onCartChange={bump} onOrder={(id) => setOrderId(id)} />
            <MenuPanel refreshKey={refreshKey} onChange={bump} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <CartPanel cart={cart} onChange={bump} onOrder={(id) => { setOrderId(id); setTab("track"); }} />
            <TrackPanel orderId={orderId} />
          </div>
        </div>
      )}
      {tab === "track" && <TrackPanel orderId={orderId} />}
      {tab === "admin" && <AdminPanel />}
    </div>
  );
}
