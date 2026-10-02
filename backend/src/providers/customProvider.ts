import { Dish, FoodProvider, ProviderOrder, Restaurant } from "./types";
import { config } from "../config";

/**
 * Template for a REAL integration (Uber Eats / DoorDash / Swiggy-Zomato aggregator).
 * Real food-delivery APIs require partner credentials and usually a proxy service.
 * Fill in FOOD_PROVIDER_BASE_URL + FOOD_PROVIDER_API_KEY and implement the fetches.
 */
export class CustomFoodProvider implements FoodProvider {
  name = "custom";
  private base = config.foodProviderBaseUrl;
  private key = config.foodProviderApiKey;

  private headers() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${this.key}` };
  }

  async listRestaurants(): Promise<Restaurant[]> {
    if (!this.base || !this.key) throw new Error("Custom provider not configured (FOOD_PROVIDER_BASE_URL / FOOD_PROVIDER_API_KEY).");
    const res = await fetch(`${this.base}/restaurants`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Provider error: ${res.status}`);
    return (await res.json()) as Restaurant[];
  }
  async getMenu(restaurantId?: string): Promise<Dish[]> {
    const res = await fetch(`${this.base}/menus?restaurantId=${restaurantId || ""}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Provider error: ${res.status}`);
    return (await res.json()) as Dish[];
  }
  async searchDishes(query: string): Promise<Dish[]> {
    const res = await fetch(`${this.base}/search?q=${encodeURIComponent(query)}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Provider error: ${res.status}`);
    return (await res.json()) as Dish[];
  }
  async placeOrder(args: { items: { dishId: string; qty: number }[] }): Promise<ProviderOrder> {
    const res = await fetch(`${this.base}/orders`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`Provider error: ${res.status}`);
    return (await res.json()) as ProviderOrder;
  }
  async fetchOrderStatus(providerOrderId: string): Promise<string> {
    const res = await fetch(`${this.base}/orders/${providerOrderId}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Provider error: ${res.status}`);
    const j = (await res.json()) as { status: string };
    return j.status;
  }
}
