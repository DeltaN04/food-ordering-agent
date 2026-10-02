import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4001),
  foodProvider: process.env.FOOD_PROVIDER || "mock",
  foodProviderApiKey: process.env.FOOD_PROVIDER_API_KEY || "",
  foodProviderBaseUrl: process.env.FOOD_PROVIDER_BASE_URL || "",
  paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
};
