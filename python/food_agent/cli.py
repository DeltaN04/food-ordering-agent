"""Interactive + one-shot CLI for the food-ordering-agent backend. Stdlib only."""
from __future__ import annotations

import argparse
import sys
import uuid

from .client import BackendClient

INTRO = (
    "Food agent (Python). Commands: menu [query] | add <dish-id> [qty] | cart | "
    "checkout [address] | track | ask <message...> | quit"
)


def cmd_menu(client: BackendClient, query: str = "") -> None:
    for d in client.dishes(query):
        print(f"{d.id}  {'VEG' if d.veg else 'NONVEG'}  {d.name} — Rs.{d.price:g}  *{d.rating}")


def cmd_cart(client: BackendClient, session: str) -> None:
    cart = client.cart(session)
    if not cart["items"]:
        print("(empty)")
        return
    for it in cart["items"]:
        d = it["dish"]
        print(f"{it['qty']}x {d['name']} — Rs.{d['price'] * it['qty']:g}")
    print(f"Total Rs.{cart['total']:g}")


def repl(client: BackendClient, session: str) -> None:
    print(INTRO)
    while True:
        try:
            line = input(f"[{session}] > ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not line:
            continue
        parts = line.split()
        cmd, rest = parts[0].lower(), parts[1:]
        try:
            if cmd in ("quit", "exit", "q"):
                return
            elif cmd == "menu":
                cmd_menu(client, " ".join(rest))
            elif cmd == "add" and rest:
                qty = int(rest[1]) if len(rest) > 1 else 1
                client.cart_add(session, rest[0], qty)
                cmd_cart(client, session)
            elif cmd == "cart":
                cmd_cart(client, session)
            elif cmd == "checkout":
                order = client.checkout(session, " ".join(rest) or "Default address")
                print(f"Order {order['id']} placed — Rs.{order['total']:g} ({order['paymentStatus']})")
            elif cmd == "track":
                o = client.latest_order(session)
                print(f"{o['id']}: {o['status']} — Rs.{o['total']:g}")
            elif cmd == "ask":
                out = client.chat(session, " ".join(rest))
                print("\n".join(out.get("replies", [])))
            else:
                out = client.chat(session, line)
                print("\n".join(out.get("replies", [])))
        except Exception as e:
            print(f"error: {e}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="food-agent", description="Python client for food-ordering-agent")
    ap.add_argument("--base", default="http://localhost:4001")
    ap.add_argument("--session", default=f"sess_{uuid.uuid4().hex[:6]}")
    ap.add_argument("command", nargs="?", default="repl", help="repl | menu | ask")
    ap.add_argument("args", nargs="*")
    ns = ap.parse_args(argv)
    client = BackendClient(ns.base)
    try:
        client.health()
    except Exception as e:
        print(f"backend unreachable at {ns.base}: {e}", file=sys.stderr)
        print("start it: cd food-ordering-agent/backend && npm install && npm run dev", file=sys.stderr)
        return 1
    if ns.command == "menu":
        cmd_menu(client, " ".join(ns.args))
    elif ns.command == "ask":
        out = client.chat(ns.session, " ".join(ns.args))
        print("\n".join(out.get("replies", [])))
    else:
        repl(client, ns.session)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
