export const API = "";
export const sessionId = "sess_" + Math.random().toString(36).slice(2, 9);

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  veg: boolean;
  cuisine: string;
  tags: string[];
  rating: number;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
