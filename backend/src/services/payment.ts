import { config } from "../config";

/** Mock payments by default; Stripe-ready stub for real charges. */
export async function charge(args: { amount: number; orderId: string; method?: string }): Promise<{ paymentId: string; status: "paid" | "failed" }> {
  if (config.paymentProvider === "stripe") {
    // TODO: stripe.paymentIntents.create({ amount: args.amount * 100, currency: "inr" })
    // Falls back to mock so demo never breaks without a key.
    if (!process.env.STRIPE_SECRET_KEY) {
      return { paymentId: "pay_mock_" + Date.now(), status: "paid" };
    }
  }
  if (args.amount <= 0) return { paymentId: "pay_mock_zero", status: "failed" };
  return { paymentId: "pay_mock_" + Date.now(), status: "paid" };
}
