import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Chat from "./Chat";
import MenuPanel, { CartPanel, TrackPanel, AdminPanel, useCart } from "./panels";
import "./styles.css";
export default function App() {
    const [tab, setTab] = useState("order");
    const [refreshKey, setRefreshKey] = useState(0);
    const [orderId, setOrderId] = useState(null);
    const { cart } = useCart(refreshKey);
    const bump = () => setRefreshKey((k) => k + 1);
    return (_jsxs("div", { className: "app", children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "\uD83C\uDF5B Food Ordering Agent" }), _jsx("span", { className: "muted", children: "mock provider \u00B7 mock payments \u00B7 Stripe-ready" })] }), _jsxs("div", { className: "tabs", children: [_jsx("button", { className: tab === "order" ? "active" : "", onClick: () => setTab("order"), children: "Order" }), _jsxs("button", { className: tab === "track" ? "active" : "", onClick: () => setTab("track"), children: ["Track ", orderId ? `(${orderId})` : ""] }), _jsx("button", { className: tab === "admin" ? "active" : "", onClick: () => setTab("admin"), children: "Admin" })] }), tab === "order" && (_jsxs("div", { className: "grid", children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [_jsx(Chat, { onCartChange: bump, onOrder: (id) => setOrderId(id) }), _jsx(MenuPanel, { refreshKey: refreshKey, onChange: bump })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [_jsx(CartPanel, { cart: cart, onChange: bump, onOrder: (id) => { setOrderId(id); setTab("track"); } }), _jsx(TrackPanel, { orderId: orderId })] })] })), tab === "track" && _jsx(TrackPanel, { orderId: orderId }), tab === "admin" && _jsx(AdminPanel, {})] }));
}
