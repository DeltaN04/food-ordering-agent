export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number; // INR
  veg: boolean;
  cuisine: string;
  tags: string[]; // e.g. spicy, biryani, paneer, budget
  rating: number; // 0-5
  image?: string;
  available: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  deliveryMins: number;
  area: string;
}

export interface ProviderOrder {
  providerOrderId: string;
  status: string;
  etaMins: number;
}

export interface FoodProvider {
  name: string;
  listRestaurants(): Promise<Restaurant[]>;
  getMenu(restaurantId?: string): Promise<Dish[]>;
  searchDishes(query: string): Promise<Dish[]>;
  /** Called when our order is placed — forward to real provider if configured. */
  placeOrder(args: { items: { dishId: string; qty: number }[] }): Promise<ProviderOrder>;
  fetchOrderStatus(providerOrderId: string): Promise<string>;
}
