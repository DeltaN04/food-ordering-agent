import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api, sessionId } from "./api";
export function useCart(refreshKey) {
    const [cart, setCart] = useState({ items: [], total: 0 });
    useEffect(() => {
        api(`/api/cart/${sessionId}`).then(setCart).catch(() => { });
    }, [refreshKey]);
    return { cart, setCart };
}
export default function MenuPanel({ refreshKey, onChange }) {
    const [dishes, setDishes] = useState([]);
    const [q, setQ] = useState("");
    const [vegOnly, setVegOnly] = useState(false);
    useEffect(() => {
        api(`/api/menu/dishes${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setDishes).catch(() => { });
    }, [q, refreshKey]);
    const filtered = dishes.filter((d) => (!vegOnly || d.veg));
    async function add(id) {
        await api(`/api/cart/${sessionId}/add`, { method: "POST", body: JSON.stringify({ dishId: id, qty: 1 }) });
        onChange();
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { margin: "0 0 8px" }, children: "Menu" }), _jsxs("div", { className: "row", style: { marginBottom: 8 }, children: [_jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search biryani, momos, paneer\u2026" }), _jsx("button", { className: vegOnly ? "primary" : "ghost", onClick: () => setVegOnly(!vegOnly), children: "Veg" })] }), filtered.map((d) => (_jsxs("div", { className: "dish", children: [_jsxs("div", { children: [_jsxs("div", { children: [_jsx("span", { className: d.veg ? "veg" : "nonveg", children: d.veg ? "VEG" : "NON-VEG" }), " ", _jsx("b", { children: d.name }), " \u2014 \u20B9", d.price] }), _jsxs("div", { className: "muted", children: [d.description, " \u00B7 \u2B50", d.rating] })] }), _jsx("button", { className: "ghost", onClick: () => add(d.id), children: "Add" })] }, d.id))), !filtered.length && _jsx("div", { className: "muted", children: "No dishes \u2014 is the backend running on :4001?" })] }));
}
export function CartPanel({ cart, onChange, onOrder }) {
    const [address, setAddress] = useState("HSR Layout, Bengaluru");
    async function checkout() {
        const o = await api(`/api/orders/checkout/${sessionId}`, {
            method: "POST", body: JSON.stringify({ address }),
        });
        onChange();
        onOrder(o.id);
    }
    return (_jsxs("div", { className: "card", children: [_jsxs("h3", { style: { margin: "0 0 8px" }, children: ["Cart \u00B7 \u20B9", cart.total] }), !cart.items.length && _jsx("div", { className: "muted", children: "Empty. Add from menu or chat." }), cart.items.map((x) => (_jsxs("div", { className: "dish", children: [_jsxs("span", { children: [x.qty, "x ", x.dish.name] }), _jsxs("span", { children: ["\u20B9", x.dish.price * x.qty, " ", _jsx("button", { className: "ghost", onClick: async () => {
                                    await api(`/api/cart/${sessionId}/remove`, { method: "POST", body: JSON.stringify({ dishId: x.dish.id }) });
                                    onChange();
                                }, children: "\u2715" })] })] }, x.dish.id))), !!cart.items.length && (_jsxs(_Fragment, { children: [_jsx("input", { value: address, onChange: (e) => setAddress(e.target.value), placeholder: "Delivery address", style: { marginTop: 8 } }), _jsxs("button", { className: "primary", style: { width: "100%", marginTop: 8 }, onClick: checkout, children: ["Checkout \u00B7 \u20B9", cart.total] })] }))] }));
}
export function TrackPanel({ orderId }) {
    const [order, setOrder] = useState(null);
    useEffect(() => {
        if (!orderId)
            return;
        const load = () => api(`/api/orders/${orderId}`).then(setOrder).catch(() => { });
        load();
        const t = setInterval(load, 5000);
        return () => clearInterval(t);
    }, [orderId]);
    if (!orderId)
        return _jsx("div", { className: "card muted", children: "No order yet \u2014 checkout to track here." });
    if (!order)
        return _jsxs("div", { className: "card", children: ["Loading ", orderId, "\u2026"] });
    return (_jsxs("div", { className: "card", children: [_jsxs("h3", { style: { margin: "0 0 8px" }, children: ["Order ", order.id] }), _jsxs("div", { children: ["Status: ", _jsx("span", { className: "status", children: order.status.replaceAll("_", " ") }), " \u00B7 Payment: ", order.paymentStatus] }), _jsxs("div", { className: "muted", children: [order.items.map((i) => `${i.qty}x ${i.name}`).join(", "), " \u00B7 \u20B9", order.total] }), _jsx("div", { className: "muted", children: "Auto-refreshes every 5s. Kitchen simulation advances placed \u2192 confirmed \u2192 preparing \u2192 out \u2192 delivered." })] }));
}
export function AdminPanel() {
    const [data, setData] = useState(null);
    const [form, setForm] = useState({ name: "", price: "", restaurantId: "r1", veg: true });
    function load() { api("/api/admin/overview").then(setData).catch(() => { }); }
    useEffect(load, []);
    if (!data)
        return _jsx("div", { className: "card muted", children: "Admin: start backend to see revenue/orders." });
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { margin: "0 0 8px" }, children: "Admin" }), _jsxs("div", { className: "muted", children: ["Dishes: ", data.dishCount, " \u00B7 Orders: ", data.orderCount, " \u00B7 Revenue: \u20B9", data.revenue] }), _jsxs("div", { className: "row", style: { margin: "8px 0" }, children: [_jsx("input", { placeholder: "Dish name", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }), _jsx("input", { placeholder: "Price", value: form.price, onChange: (e) => setForm({ ...form, price: e.target.value }) }), _jsx("select", { value: form.restaurantId, onChange: (e) => setForm({ ...form, restaurantId: e.target.value }), children: data.restaurants.map((r) => _jsx("option", { value: r.id, children: r.name }, r.id)) }), _jsx("button", { className: "primary", onClick: async () => {
                            await api("/api/admin/dishes", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price) }) });
                            setForm({ name: "", price: "", restaurantId: "r1", veg: true });
                            load();
                        }, children: "Add dish" })] }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Order" }), _jsx("th", { children: "Items" }), _jsx("th", { children: "Total" }), _jsx("th", { children: "Status" })] }) }), _jsx("tbody", { children: data.orders.map((o) => (_jsxs("tr", { children: [_jsx("td", { children: o.id }), _jsx("td", { children: o.items.map((i) => `${i.qty}x ${i.name}`).join(", ") }), _jsxs("td", { children: ["\u20B9", o.total] }), _jsx("td", { children: o.status })] }, o.id))) })] })] }));
}
