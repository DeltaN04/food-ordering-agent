<div align="center">

# 🍛 Food Ordering Agent

**Chat-first food ordering across real platforms — from prompt to payment page, autonomously.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-automation-2EAD33?logo=playwright)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Type "veg biryani under 200" → get picks → cart → checkout → track — or point the bot at Swiggy and watch it order for you.*

</div>

## ✨ What it does

| Surface | Details |
|---|---|
| 💬 Chat ordering API | Intent parsing (menu, recommend, filter, cart, checkout, track), explainable recommendation engine (veg / budget / cuisine / rating), order state machine with live kitchen simulation |
| 🖥️ Web UI | React chat + menu search + cart drawer + live order tracking (5s refresh) + admin dashboard (revenue, orders, dish management) |
| 🤖 Real-platform bot | Playwright adapter that drives Swiggy end-to-end: find restaurant → match dish + size → add via the app's own Redux handlers (bot-blocked buttons bypassed) → saved address → payments page → **stops before charging** |
| 🐍 Python client | Zero-dependency CLI + REPL over the same API |

> **Proven on a live order:** McAloo Tikki meal from McDonald's (Baner) → Casual address → payments page at ₹264, with honest fallbacks along the way (no "Large" variant exists for that dish — the bot reports the Medium combo instead of failing; UPI wasn't offered — it says so and suggests the closest QR path).

## 🏗️ Architecture

```
food-ordering-agent/
├── backend/      Express + TS — chat agent, recommender, cart/order stores,
│                 mock + real provider adapters, Stripe-ready payments
├── frontend/     React + Vite — chat, menu, cart, tracking, admin
├── automation/   Playwright — PlatformAdapter interface
│                 ├── platforms/swiggy.ts   ✅ live (React-fiber dispatch, menu API, address + payments flow)
│                 └── platforms/zomato.ts   🚧 stub (same contract — record selectors with codegen)
└── python/       Stdlib-only API client + CLI
```

**Key engineering decisions:**
- Menu ADD buttons ignore synthetic DOM events (WAF bot checks) → the bot invokes the app's own `updateItem` Redux thunk through the live React fiber. Same UI result, zero fakery.
- `FoodProvider` / `PlatformAdapter` interfaces keep Swiggy/Zomato/UberEats swappable; payments are mock-by-default, Stripe-ready.
- The bot **never charges** — it stops at the payment screen for manual QR/card pay.

## 🚀 Quickstart

```bash
# 1. Chat API + UI (mock data, no keys needed)
cd backend && npm install && npm run dev        # :4001
cd frontend && npm install && npm run dev       # :5174

# 2. Python client
cd python && python3 -m food_agent.cli menu biryani

# 3. Real-platform bot (Swiggy)
cd automation && npm install && npx playwright install chromium
npm run order -- --platform swiggy \
  --restaurant "McDonald's" \
  --dish "McAloo Tikki Burger + Coke Combo" \
  --size medium --qty 1 --address Casual --payment upi
# First run opens a real browser: log in + set location once (saved in .profiles/).
```

## ➕ Add a platform

Implement `PlatformAdapter` (`automation/src/types.ts` — 10 methods: login → restaurant → dish → cart → address → payments), register it in `automation/src/registry.ts`. The Swiggy adapter is the commented reference.

## 📄 License

MIT — see [LICENSE](LICENSE).
