"""HTTP client for the food-ordering-agent backend. Stdlib only (urllib)."""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from dataclasses import dataclass


@dataclass
class Dish:
    id: str
    name: str
    price: float
    veg: bool
    cuisine: str = ""
    rating: float = 0.0

    @classmethod
    def from_json(cls, d: dict) -> "Dish":
        return cls(
            id=str(d.get("id", "")),
            name=str(d.get("name", "")),
            price=float(d.get("price", 0)),
            veg=bool(d.get("veg", False)),
            cuisine=str(d.get("cuisine", "")),
            rating=float(d.get("rating", 0) or 0),
        )


class BackendClient:
    def __init__(self, base_url: str = "http://localhost:4001", timeout: int = 15):
        self.base = base_url.rstrip("/")
        self.timeout = timeout

    def _req(self, method: str, path: str, body: dict | None = None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            self.base + path,
            data=data,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                return json.loads(res.read().decode() or "null")
        except urllib.error.HTTPError as e:
            try:
                detail = e.read().decode()
            except Exception:
                detail = e.reason
            raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from e

    def health(self) -> dict:
        return self._req("GET", "/api/health")

    def chat(self, session_id: str, message: str) -> dict:
        return self._req("POST", "/api/chat", {"sessionId": session_id, "message": message})

    def dishes(self, query: str = "", restaurant_id: str = "") -> list[Dish]:
        qs = ""
        if query:
            qs = "?" + urllib.parse.urlencode({"q": query})
        elif restaurant_id:
            qs = "?" + urllib.parse.urlencode({"restaurantId": restaurant_id})
        return [Dish.from_json(d) for d in self._req("GET", "/api/menu/dishes" + qs)]

    def restaurants(self) -> list[dict]:
        return self._req("GET", "/api/menu/restaurants")

    def cart(self, session_id: str) -> dict:
        return self._req("GET", f"/api/cart/{session_id}")

    def cart_add(self, session_id: str, dish_id: str, qty: int = 1) -> dict:
        return self._req("POST", f"/api/cart/{session_id}/add", {"dishId": dish_id, "qty": qty})

    def checkout(self, session_id: str, address: str = "Default address") -> dict:
        return self._req("POST", f"/api/orders/checkout/{session_id}", {"address": address})

    def order(self, order_id: str) -> dict:
        return self._req("GET", f"/api/orders/{order_id}")

    def latest_order(self, session_id: str) -> dict:
        return self._req("GET", f"/api/orders/latest/{session_id}")

    def admin_overview(self) -> dict:
        return self._req("GET", "/api/admin/overview")
