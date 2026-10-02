import { Dish } from "../providers/types";

export interface Prefs {
  veg?: boolean;
  maxPrice?: number;
  cuisine?: string;
  keyword?: string;
}

/** Score dishes by prefs + rating. Simple, explainable, no LLM key required. */
export function recommend(dishes: Dish[], prefs: Prefs, limit = 3): { dish: Dish; reason: string }[] {
  const scored = dishes
    .filter((d) => d.available)
    .map((d) => {
      let s = d.rating * 2;
      const reasons: string[] = [`rated ${d.rating}`];
      if (prefs.veg !== undefined) {
        if (prefs.veg === d.veg) { s += 3; reasons.push(prefs.veg ? "veg" : "non-veg"); }
        else s -= 5;
      }
      if (prefs.maxPrice !== undefined) {
        if (d.price <= prefs.maxPrice) { s += 2; reasons.push(`₹${d.price} within budget`); }
        else s -= (d.price - prefs.maxPrice) / 50;
      }
      if (prefs.cuisine && d.cuisine.toLowerCase().includes(prefs.cuisine.toLowerCase())) {
        s += 3; reasons.push(`${d.cuisine} cuisine`);
      }
      if (prefs.keyword && (d.name.toLowerCase().includes(prefs.keyword) || d.tags.some((t) => t.includes(prefs.keyword!)))) {
        s += 3; reasons.push(`matches "${prefs.keyword}"`);
      }
      if (d.tags.includes("bestseller")) { s += 1; reasons.push("bestseller"); }
      return { dish: d, score: s, reason: reasons.join(" · ") };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function parsePrefs(text: string): Prefs {
  const t = text.toLowerCase();
  const prefs: Prefs = {};
  if (/\bveg\b/.test(t) || /paneer|dosa|idli/.test(t)) prefs.veg = true;
  if (/non-?veg|chicken|egg|fish/.test(t)) prefs.veg = false;
  const m = t.match(/under\s*(\d+)|below\s*(\d+)|<\s*(\d+)|budget\s*(\d+)/);
  if (m) prefs.maxPrice = Number(m[1] || m[2] || m[3] || m[4]);
  const cuisines = ["biryani", "chinese", "south indian", "north indian", "healthy", "dessert", "beverage"];
  for (const c of cuisines) if (t.includes(c)) { prefs.cuisine = c; break; }
  const kw = ["spicy", "biryani", "paneer", "dosa", "noodles", "momos", "chicken", "sweet", "coffee", "budget", "healthy"];
  for (const k of kw) if (t.includes(k)) { prefs.keyword = k; break; }
  return prefs;
}
