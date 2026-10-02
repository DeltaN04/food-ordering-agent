import type { Page } from "playwright";
import { chromium, type BrowserContext } from "playwright";
import type { DishMatch, PaymentOption, PaymentPreference, PlatformAdapter } from "../types";

/**
 * Zomato adapter skeleton — same flow contract as Swiggy.
 * TODO: fill in selectors once you capture them with `npx playwright codegen zomato.com`.
 * Known notes: Zomato requires login for checkout; dish pages are SPA routes under
 * /<city>/<restaurant>-<id>/order; cart persists per-session in localStorage + API.
 */
export class ZomatoAdapter implements PlatformAdapter {
  readonly id = "zomato";
  readonly label = "Zomato";
  private ctx: BrowserContext | null = null;

  async launch(profileDir: string): Promise<Page> {
    this.ctx = await chromium.launchPersistentContext(profileDir, { headless: false });
    return this.ctx.pages()[0] || this.ctx.newPage();
  }

  async ensureLoggedIn(page: Page) {
    await page.goto("https://www.zomato.com/", { waitUntil: "domcontentloaded" });
    const logged = await page.evaluate(() => document.cookie.includes("zomatouser") || document.body.innerText.includes("Log out"));
    if (!logged) throw new Error("Not logged in — log in once in the opened browser, then re-run.");
    return { loggedIn: true as const };
  }

  async findRestaurant(page: Page, query: string): Promise<string> {
    await page.goto(`https://www.zomato.com/search?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" });
    throw new Error("ZomatoAdapter.findRestaurant not implemented — record selectors with playwright codegen first.");
  }

  async findDish(): Promise<DishMatch[]> {
    throw new Error("ZomatoAdapter.findDish not implemented.");
  }

  async addToCart(): Promise<void> {
    throw new Error("ZomatoAdapter.addToCart not implemented.");
  }

  async readCart(page: Page) {
    void page;
    return { count: 0, items: [] as { name: string; qty: number }[] };
  }

  async gotoCheckout(page: Page) {
    await page.goto("https://www.zomato.com/checkout", { waitUntil: "domcontentloaded" });
  }

  async selectAddress(): Promise<{ selected: string; total: number }> {
    throw new Error("ZomatoAdapter.selectAddress not implemented.");
  }

  async gotoPayments(): Promise<void> {
    throw new Error("ZomatoAdapter.gotoPayments not implemented.");
  }

  async listPaymentOptions(): Promise<PaymentOption[]> {
    throw new Error("ZomatoAdapter.listPaymentOptions not implemented.");
  }

  async selectPayment(page: Page, pref: PaymentPreference) {
    void page;
    void pref;
    return { selected: "none", payHint: "Zomato payments not automated yet." };
  }

  async close() {
    await this.ctx?.close();
  }
}
