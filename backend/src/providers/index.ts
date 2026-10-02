import { config } from "../config";
import { FoodProvider } from "./types";
import { MockFoodProvider } from "./mockProvider";
import { CustomFoodProvider } from "./customProvider";

let instance: FoodProvider | null = null;

export function getProvider(): FoodProvider {
  if (instance) return instance;
  if (config.foodProvider === "custom") instance = new CustomFoodProvider();
  else instance = new MockFoodProvider();
  return instance;
}

export function getMockProvider(): MockFoodProvider | null {
  const p = getProvider();
  return p instanceof MockFoodProvider ? p : null;
}
