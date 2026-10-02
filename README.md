# Food Ordering Agent

Chat-first food ordering agent with mock + real-provider adapters, recommendations, cart, payments (mock + Stripe-ready), tracking, and admin.

## Structure

```
food-ordering-agent/
  backend/    — Express + TS chat agent API
  frontend/   — React + Vite chat ordering UI
  automation/ — Playwright cross-platform ordering bot (Swiggy live, Zomato stub)
  python/     — Python client + CLI for the backend API (stdlib only)
```

## Python client

```bash
cd python
python3 -m food_agent.cli menu biryani        # browse
python3 -m food_agent.cli ask "veg under 150" # chat
python3 -m food_agent.cli                      # interactive: menu | add | cart | checkout | track | ask
```

## Automation bot (real platforms)

```bash
cd automation
npm install
npx playwright install chromium   # one-time browser download
npm run order -- --platform swiggy --restaurant "McDonald's" --dish "McAloo Tikki Burger + Coke Combo" --size medium --qty 1 --address Casual --payment upi
```

First run opens a real browser — log in + set location once (saved in `automation/.profiles/`).
The bot adds to cart via the app's own handlers (bot-protected ADD buttons ignore
synthetic clicks), selects your saved address, opens payments, and STOPS before any
charge so you pay manually (QR/card). If UPI isn't offered it says so and suggests
the closest QR path instead of guessing.

Add a platform: implement `PlatformAdapter` in `automation/src/types.ts`
(see `platforms/swiggy.ts` reference, `platforms/zomato.ts` stub) + register it.

## Quick start

```bash
# backend
cd backend
npm install
npm run dev   # http://localhost:4001

# frontend (new terminal)
cd frontend
npm install
npm run dev   # http://localhost:5174
```

Backend defaults to `MockFoodProvider` (3 restaurants, ~18 dishes).
To plug a real provider (Uber Eats / DoorDash / Swiggy / Zomato via aggregator):

1. Copy `backend/.env.example` → `backend/.env`
2. Set `FOOD_PROVIDER=custom` + API keys
3. Implement `backend/src/providers/customProvider.ts` against `FoodProvider` interface in `providers/types.ts`.

Payments: defaults to `mock` (instant success). Set `PAYMENT_PROVIDER=stripe` + `STRIPE_SECRET_KEY` to wire Stripe (stub leaves a clear TODO + fallback).

## Chat API

`POST /api/chat { sessionId, message }` → `{ replies[], intent, cart, order, recommendations[] }`

Try: "veg biryani under 300", "add 2 chicken biryani", "checkout", "track my order", "recommend something spicy".
