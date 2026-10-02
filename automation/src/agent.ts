import * as path from "path";
import { getAdapter } from "./registry";
import type { OrderRequest, ProgressCb } from "./types";

/**
 * Cross-platform order flow. Stops before any charge when stopBeforePay is set
 * (default) — the user always completes payment manually (QR, card, etc.).
 */
export async function runOrder(req: OrderRequest, onProgress: ProgressCb = console.log) {
  const emit = (stage: string, detail: string) => onProgress({ stage, detail } as never);
  const adapter = getAdapter(req.platform);
  const profileDir = path.join(process.cwd(), ".profiles", adapter.id);
  const page = await adapter.launch(profileDir);
  try {
    emit("login", `Checking ${adapter.label} session…`);
    const login = await adapter.ensureLoggedIn(page);
    emit("login", `Logged in${login.user ? ` as ${login.user}` : ""}.`);

    emit("restaurant", `Finding "${req.restaurantQuery}"…`);
    const url = await adapter.findRestaurant(page, req.restaurantQuery);
    emit("restaurant", url);
    await page.goto(url, { waitUntil: "domcontentloaded" });

    emit("menu", `Searching "${req.dishQuery}"${req.size ? ` (${req.size})` : ""}…`);
    const dishes = await adapter.findDish(page, req.dishQuery, req.size);
    const dish = dishes[0];
    emit("menu", `${dish.name} — ₹${dish.price}${dish.sizeNote ? ` [${dish.sizeNote}]` : ""}`);

    emit("cart", `Adding ${req.qty || 1}x to cart…`);
    await adapter.addToCart(page, dish, req.qty || 1);
    const cart = await adapter.readCart(page);
    emit("cart", `${cart.count} item(s): ${cart.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}`);

    emit("checkout", "Opening checkout…");
    await adapter.gotoCheckout(page);
    const addr = await adapter.selectAddress(page, req.addressLabel);
    emit("address", `${addr.selected} — total ₹${addr.total}`);

    emit("payments", "Opening payments…");
    await adapter.gotoPayments(page);
    const pay = await adapter.selectPayment(page, req.payment);
    emit("payment", `${pay.selected} — ${pay.payHint}`);

    if (req.stopBeforePay !== false) {
      emit("done", "STOPPED before any charge. Complete payment manually in the browser window.");
      return { status: "awaiting_payment", dish, cart, addr, pay };
    }
    throw new Error("Auto-pay is disabled by design — set stopBeforePay and pay manually.");
  } finally {
    // keep browser open so the user can pay
  }
}
