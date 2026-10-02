import { Dish, FoodProvider, ProviderOrder, Restaurant } from "./types";
import { dishes, restaurants } from "../data/seed";

/** Default in-process provider backed by seed data. Swap via FOOD_PROVIDER=custom. */
export class MockFoodProvider implements FoodProvider {
  name = "mock";
  async listRestaurants(): Promise<Restaurant[]> {
    return restaurants;
  }
  async getMenu(restaurantId?: string): Promise<Dish[]> {
    if (!restaurantId) return dishes.filter((d) => d.available);
    return dishes.filter((d) => d.restaurantId === restaurantId && d.available);
  }
  async searchDishes(query: string): Promise<Dish[]> {
    const q = query.toLowerCase().trim();
    if (!q) return dishes.filter((d) => d.available);
    return dishes.filter(
      (d) =>
        d.available &&
        (d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.cuisine.toLowerCase().includes(q) ||
          d.tags.some((t) => t.includes(q)))
    );
  }
  async placeOrder(): Promise<ProviderOrder> {
    return { providerOrderId: "mock-" + Date.now(), status: "confirmed", etaMins: 30 };
  }
  async fetchOrderStatus(): Promise<string> {
    return "preparing";
  }
  // Admin helpers (mock-only)
  addDish(d: Dish) {
    dishes.push(d);
  }
  updateDish(id: string, patch: Partial<Dish>) {
    const i = dishes.findIndex((d) => d.id === id);
    if (i >= 0) dishes[i] = { ...dishes[i], ...patch };
    return dishes[i];
  }
  removeDish(id: string) {
    const i = dishes.findIndex((d) => d.id === id);
    if (i >= 0) dishes.splice(i, 1);
    return i >= 0;
  }
}
