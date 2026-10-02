import type { PlatformAdapter } from "./types";
import { SwiggyAdapter } from "./platforms/swiggy";
import { ZomatoAdapter } from "./platforms/zomato";

const adapters: PlatformAdapter[] = [new SwiggyAdapter(), new ZomatoAdapter()];

export function getAdapter(platform: string): PlatformAdapter {
  const a = adapters.find((x) => x.id === platform.toLowerCase());
  if (!a) throw new Error(`Unknown platform "${platform}". Available: ${adapters.map((x) => x.id).join(", ")}`);
  return a;
}

export function listPlatforms() {
  return adapters.map((a) => ({ id: a.id, label: a.label }));
}
