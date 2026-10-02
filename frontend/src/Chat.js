import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { api, sessionId } from "./api";
export default function Chat({ onCartChange, onOrder }) {
    const [msgs, setMsgs] = useState([
        { role: "bot", text: "Namaste! Try: 'veg biryani under 200' / 'recommend spicy' / 'add 2 momos' / 'checkout' / 'track my order'." },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);
    useEffect(() => { ref.current?.scrollTo({ top: 99999 }); }, [msgs]);
    async function send(text) {
        const message = (text ?? input).trim();
        if (!message || loading)
            return;
        setInput("");
        setMsgs((m) => [...m, { role: "user", text: message }]);
        setLoading(true);
        try {
            const out = await api(`/api/chat`, {
                method: "POST",
                body: JSON.stringify({ sessionId, message }),
            });
            setMsgs((m) => [...m, ...out.replies.map((r) => ({ role: "bot", text: r }))]);
            onCartChange();
            if (out.orderId)
                onOrder(out.orderId);
        }
        catch (e) {
            setMsgs((m) => [...m, { role: "bot", text: "Backend not reachable. Start it: cd food-ordering-agent/backend && npm install && npm run dev" }]);
        }
        finally {
            setLoading(false);
        }
    }
    const suggestions = ["menu", "veg under 150", "recommend spicy chicken", "add 2 masala dosa", "cart", "checkout", "track my order"];
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { margin: "0 0 8px" }, children: "Chat ordering" }), _jsxs("div", { className: "chatbox", ref: ref, children: [msgs.map((m, i) => (_jsx("div", { className: `msg ${m.role}`, children: m.text }, i))), loading && _jsx("div", { className: "msg bot", children: "typing\u2026" })] }), _jsx("div", { className: "chips", children: suggestions.map((s) => (_jsx("button", { className: "ghost", onClick: () => send(s), children: s }, s))) }), _jsxs("div", { className: "row", children: [_jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && send(), placeholder: "Type a craving or command\u2026" }), _jsx("button", { className: "primary", onClick: () => send(), children: "Send" })] })] }));
}
export function useDishes() {
    const [dishes, setDishes] = useState([]);
    useEffect(() => {
        api("/api/menu/dishes").then(setDishes).catch(() => { });
    }, []);
    return dishes;
}
