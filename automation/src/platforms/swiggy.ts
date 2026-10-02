import { chromium, type BrowserContext, type Page } from "playwright";
import type { DishMatch, PaymentOption, PaymentPreference, PlatformAdapter } from "../types";

const BASE = "https://www.swiggy.com";

/**
 * Reference adapter. Lessons baked in from a real order:
 * - Menu ADD buttons ignore synthetic DOM events (WAF bot checks) → dispatch via
 *   the app's own React component props (updateItem thunk), never element.click().
 * - No "Large" exists for every dish — match size variants from the menu API and
 *   report the fallback (e.g. Medium combo) instead of failing.
 * - UPI/QR is not always offered — read get-payment-options and surface choices,
 *   never complete a charge.
 */
export class SwiggyAdapter implements PlatformAdapter {
  readonly id = "swiggy";
  readonly label = "Swiggy";
  private ctx: BrowserContext | null = null;

  async launch(profileDir: string): Promise<Page> {
    this.ctx = await chromium.launchPersistentContext(profileDir, {
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    const page = this.ctx.pages()[0] || (await this.ctx.newPage());
    return page;
  }

  async ensureLoggedIn(page: Page) {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const cookies = await this.ctx!.cookies();
    const logged = cookies.some((c) => c.name === "_is_logged_in" && c.value === "1");
    let user: string | undefined;
    if (logged) {
      const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
      user = text.split("\n").find((l) => l && !/cart|help|search|swiggy/i.test(l));
    }
    if (!logged) throw new Error("Not logged in — log in once in the opened browser, then re-run.");
    return { loggedIn: true as const, user };
  }

  private async loc(page: Page): Promise<{ lat: string; lng: string }> {
    const cookies = await this.ctx!.cookies();
    const raw = cookies.find((c) => c.name === "userLocation")?.value || "";
    try {
      const j = JSON.parse(decodeURIComponent(raw));
      return { lat: String(j.lat), lng: String(j.lng) };
    } catch {
      throw new Error("No delivery location — set it once in the browser first.");
    }
  }

  async findRestaurant(page: Page, query: string): Promise<string> {
    await page.goto(`${BASE}/search?query=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" });
    const href: string | null = await page.evaluate((q: string) => {
      const links = Array.from(document.querySelectorAll("a"));
      const ql = q.toLowerCase().split(/\s+/)[0];
      const hit = links.find((a) => /mcdonald|restaurant/i.test(a.innerText) || a.href.includes("/city/"));
      const byName = links.find((a) => (a.innerText || "").toLowerCase().includes(ql) && a.href.includes("/city/"));
      return (byName || hit)?.href || null;
    }, query);
    if (!href) throw new Error(`Restaurant not found for "${query}"`);
    return href;
  }

  async findDish(page: Page, dishQuery: string, size?: string): Promise<DishMatch[]> {
    const m = page.url().match(/rest(\d+)/);
    if (!m) throw new Error("Open a restaurant page first (findRestaurant).");
    const { lat, lng } = await this.loc(page);
    const url = `${BASE}/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${m[1]}&catalog_qa=undefined&submitAction=ENTER`;
    const dishes: DishMatch[] = await page.evaluate(async (args: { url: string; q: string }) => {
      const res = await fetch(args.url, { headers: { __fetch_req__: "true" } as HeadersInit });
      const text = await res.text();
      const re = /"id":"(\d+)","name":"([^"]+)","category":"[^"]*","description":"[^"]*","imageId":"[^"]*","inStock":1,"isVeg":\d,"price":(\d+)/g;
      const out: { id: string; name: string; price: number; sizeNote?: string }[] = [];
      let mt: RegExpExecArray | null;
      const ql = args.q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      while ((mt = re.exec(text)) !== null && out.length < 60) {
        const name: string = mt[2];
        const nl = name.toLowerCase();
        if (ql.every((w) => nl.includes(w))) out.push({ id: mt[1], name, price: Number(mt[3]) / 100 });
      }
      return out;
    }, { url, q: dishQuery });
    if (!dishes.length) throw new Error(`No dish matches "${dishQuery}"`);
    if (size) {
      const s = size.toLowerCase();
      const want = s.startsWith("l") ? "(L)" : s.startsWith("m") ? "(M)" : s.startsWith("r") ? "(R)" : "";
      if (want) {
        const sized = dishes.filter((d) => d.name.includes(want));
        if (sized.length) return sized;
        const first = dishes[0];
        first.sizeNote = `No ${size} variant on menu — closest: ${first.name}`;
        return [first, ...dishes.slice(1)];
      }
    }
    return dishes;
  }

  /** Dispatches the app's own Redux updateItem thunk via the live React fiber. */
  async addToCart(page: Page, dish: DishMatch, qty = 1): Promise<void> {
    await page.evaluate((name: string) => { (window as unknown as { __dishName: string }).__dishName = name; }, dish.name);
    for (let i = 0; i < qty; i++) {
      const added: { ok: boolean; err?: string } = await page.evaluate(() => {
        const getK = (el: Element) => Object.keys(el).filter((k) => k.indexOf("__reactInternalInstance") === 0)[0];
        const want: string = (window as unknown as { __dishName: string }).__dishName;
        const cards = Array.from(document.querySelectorAll('[data-testid="normal-dish-item"]'));
        let card: Element | null = null;
        for (const c of cards) {
          const h = c.querySelector("h3");
          if (h && (h.innerText || "").indexOf(want) === 0) { card = c; break; }
        }
        if (!card) return { ok: false, err: "dish card not in view (scroll menu first)" };
        const btns = Array.from(card.querySelectorAll("button")).filter((b) => (b.innerText || "").trim() === "ADD");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let node: any = (btns[0] as unknown as Record<string, unknown>)[getK(btns[0]) as string];
        for (let d = 0; d < 20 && node; d++) {
          const mp = node.memoizedProps || {};
          if (mp.updateItem && mp.foodItem && mp.itemMetaData) {
            try {
              mp.updateItem({ item: mp.foodItem, restaurantId: mp.restaurantId, itemMetaData: mp.itemMetaData, change: 1 });
              return { ok: true };
            } catch (e) { return { ok: false, err: String(e).slice(0, 200) }; }
          }
          node = node.return;
        }
        return { ok: false, err: "updateItem fiber not found" };
      });
      if (!added.ok) throw new Error(`addToCart failed: ${added.err}`);
    }
    const cart = await this.readCart(page);
    if (!cart.items.some((it) => it.name === dish.name)) throw new Error("Add appeared to succeed but cart is empty — re-check menu/availability.");
  }

  async readCart(page: Page) {
    return page.evaluate(() => {
      return fetch("/dapi/cart", { headers: { __fetch_req__: "true" } as HeadersInit })
        .then((r) => r.json())
        .then((j) => {
          const items: { name: string; qty: number }[] = [];
          const bag = j.data?.cartItems || {};
          Object.keys(bag).forEach((k) => (bag[k].items || []).forEach((it: { name: string; quantity: number }) => items.push({ name: it.name, qty: it.quantity })));
          return { count: j.data?.cartItemsCount || 0, items };
        });
    });
  }

  async gotoCheckout(page: Page) {
    await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.body.innerText.includes("McDonald's") || document.body.innerText.includes("Bill Details"), { timeout: 20000 });
  }

  private async clickDiv(page: Page, text: string, cardHint?: string): Promise<boolean> {
    return page.evaluate((args: { text: string; hint?: string }) => {
      const els = Array.from(document.querySelectorAll("div")).filter((e) => {
        const t = (e as HTMLElement).innerText || "";
        return e.children.length === 0 && t.trim() === args.text;
      });
      let target = els[0];
      if (args.hint) {
        for (const el of els) {
          let p = el.parentElement;
          for (let d = 0; d < 10 && p; d++) {
            const txt = p.innerText || "";
            if (txt.includes(args.hint) && txt.length < 800) { target = el; break; }
            p = p.parentElement;
          }
          if (target !== els[0]) break;
        }
      }
      if (!target) return false;
      target.scrollIntoView({ block: "center" });
      const r = target.getBoundingClientRect();
      const init = { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5 };
      target.dispatchEvent(new MouseEvent("mousedown", init));
      target.dispatchEvent(new MouseEvent("mouseup", init));
      target.dispatchEvent(new MouseEvent("click", init));
      return true;
    }, { text, hint: cardHint });
  }

  async selectAddress(page: Page, label?: string) {
    if (label) {
      const changed = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("div")).filter((e) => {
          const t = e.innerText || "";
          return e.children.length === 0 && t.trim() === "CHANGE";
        });
        return els.length > 0;
      });
      if (changed) await this.clickDiv(page, "CHANGE");
      await page.waitForFunction(() => document.body.innerText.includes("DELIVER HERE"), { timeout: 15000 });
      const hintMap: Record<string, string> = {};
      void hintMap;
      // Pick the card whose text contains the label; fall back to label substring match
      const picked: boolean = await page.evaluate((lbl: string) => {
        const els = Array.from(document.querySelectorAll("div")).filter((e) => {
          const t = e.innerText || "";
          return e.children.length === 0 && t.trim() === "DELIVER HERE";
        });
        for (const el of els) {
          let p = el.parentElement;
          let card = "";
          for (let d = 0; d < 10 && p; d++) {
            const txt = p.innerText || "";
            if (txt.includes("MINS") && txt.includes("DELIVER HERE") && txt.length < 800) { card = txt; break; }
            p = p.parentElement;
          }
          if (card.toLowerCase().includes(lbl.toLowerCase())) {
            el.scrollIntoView({ block: "center" });
            const r = el.getBoundingClientRect();
            const init = { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5 };
            el.dispatchEvent(new MouseEvent("mousedown", init));
            el.dispatchEvent(new MouseEvent("mouseup", init));
            el.dispatchEvent(new MouseEvent("click", init));
            return true;
          }
        }
        return false;
      }, label);
      if (!picked) throw new Error(`Saved address "${label}" not found — check the name in your Swiggy account.`);
    }
    const snap: { selected: string; total: number } = await page.evaluate(() => {
      const t = document.body.innerText;
      const sel = (t.match(/(Home|Work|Friends|Casual|Other)\n/) || [])[1] || "unknown";
      const tot = (t.match(/TO PAY\n(\d+)/) || [])[1] || "0";
      return { selected: sel, total: Number(tot) };
    });
    return snap;
  }

  async gotoPayments(page: Page) {
    const clicked: boolean = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("div,button,a"));
      const t = all.find((e) => ((e as HTMLElement).innerText || "").trim() === "PROCEED TO PAY");
      if (!t) return false;
      (t as HTMLElement).click();
      return true;
    });
    if (!clicked) throw new Error("PROCEED TO PAY not found — is the address selected?");
    await page.waitForURL(/payments/, { timeout: 20000 });
  }

  async listPaymentOptions(page: Page): Promise<PaymentOption[]> {
    await page.waitForFunction(() => document.body.innerText.includes("Payment Options"), { timeout: 20000 });
    return page.evaluate(() => {
      const t = document.body.innerText;
      const groups = ["UPI", "Credit & Debit Cards", "Pluxee", "Wallets", "Netbanking", "Pay on Delivery"];
      return groups
        .filter((g) => t.includes(g))
        .map((g) => ({ group: g, name: g, supportsQR: /upi|pay on delivery/i.test(g) }));
    });
  }

  async selectPayment(page: Page, pref: PaymentPreference) {
    const opts = await this.listPaymentOptions(page);
    const upi = opts.find((o) => /upi/i.test(o.group));
    if (pref === "upi") {
      if (!upi) {
        return {
          selected: "none",
          payHint: `UPI/QR is NOT offered for this order. Available: ${opts.map((o) => o.group).join(", ")}. Closest QR path: Pay on Delivery → pay online to the rider.`,
        };
      }
    }
    return { selected: upi?.group || opts[0]?.group || "none", payHint: "Complete payment manually in the browser — the bot never charges." };
  }

  async close() {
    await this.ctx?.close();
  }
}
