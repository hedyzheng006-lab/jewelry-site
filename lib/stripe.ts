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

// Countries offered on the Stripe address form. Edit to match where you ship.
export const SHIPPING_COUNTRIES = [
  "US", "CA", "GB", "AU", "NZ", "IE", "FR", "DE", "IT", "ES", "NL", "SE", "JP", "SG", "HK",
] as const;

// Flat shipping rate in USD, shown as a line on the Stripe checkout page.
export const SHIPPING_FLAT_USD = 6;
