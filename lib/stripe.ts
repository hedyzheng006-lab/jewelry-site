import Stripe from "stripe";

// Stripe client for the checkout routes. This site is a demo, so only test keys
// (sk_test_...) are accepted: no real card can be charged.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new CheckoutError("Checkout is not set up yet. Add STRIPE_SECRET_KEY to the environment.", 503);
  if (!key.startsWith("sk_test_")) {
    throw new CheckoutError("Checkout only runs in Stripe test mode. Use a test key that starts with sk_test_.", 503);
  }
  return new Stripe(key);
}

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export { SHIPPING_COUNTRIES, SHIPPING_FLAT_USD } from "@/lib/shipping";
