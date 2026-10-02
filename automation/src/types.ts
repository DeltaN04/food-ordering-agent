import type { Page } from "playwright";

export type PaymentPreference = "upi" | "card" | "wallet" | "netbanking" | "cod" | "any-online";

export interface OrderRequest {
  platform: string;
  restaurantQuery: string;
  dishQuery: string;
  /** e.g. "large" — adapter matches closest size variant, falls back with a note */
  size?: string;
  qty?: number;
  /** saved-address label, e.g. "Casual", "Home" */
  addressLabel?: string;
  payment: PaymentPreference;
  /** suburb/city used for delivery location if no session exists */
  location?: { lat: number; lng: number; label: string };
  /** stop before placing/paying (default true — user pays manually) */
  stopBeforePay?: boolean;
}

export interface DishMatch {
  id: string;
  name: string;
  price: number;
  sizeNote?: string;
}

export interface PaymentOption {
  group: string;
  name: string;
  supportsQR: boolean;
}

export interface OrderProgress {
  stage: string;
  detail: string;
}

/** Every food platform implements this. See platforms/swiggy.ts for the reference. */
export interface PlatformAdapter {
  readonly id: string;
  readonly label: string;
  /** Launch with a persistent profile so the user's login session is reused. */
  launch(profileDir: string): Promise<Page>;
  ensureLoggedIn(page: Page): Promise<{ loggedIn: boolean; user?: string }>;
  /** Find restaurant page URL for a query (uses saved location). */
  findRestaurant(page: Page, query: string): Promise<string>;
  /** Return menu matches for a dish query, best-first. */
  findDish(page: Page, dishQuery: string, size?: string): Promise<DishMatch[]>;
  /** Add dish to cart. Must use the app's own handlers/APIs, NOT synthetic DOM clicks. */
  addToCart(page: Page, dish: DishMatch, qty?: number): Promise<void>;
  readCart(page: Page): Promise<{ count: number; items: { name: string; qty: number }[] }>;
  gotoCheckout(page: Page): Promise<void>;
  /** Select a saved address by label. Returns the selected label + order total. */
  selectAddress(page: Page, label?: string): Promise<{ selected: string; total: number }>;
  gotoPayments(page: Page): Promise<void>;
  listPaymentOptions(page: Page): Promise<PaymentOption[]>;
  /** Select a payment option. Never completes a charge — returns a QR/manual-pay hint. */
  selectPayment(page: Page, pref: PaymentPreference): Promise<{ selected: string; payHint: string }>;
  close(page: Page): Promise<void>;
}

export type ProgressCb = (p: OrderProgress) => void;
