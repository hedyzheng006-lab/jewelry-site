// Shipping settings, shared by the cart page and Stripe checkout.

// Countries offered on the Stripe address form. Edit to match where you ship.
export const SHIPPING_COUNTRIES = [
  "US", "CA", "GB", "AU", "NZ", "IE", "FR", "DE", "IT", "ES", "NL", "SE", "JP", "SG", "HK",
] as const;

// Flat shipping rate in USD, shown as a line on the Stripe checkout page.
export const SHIPPING_FLAT_USD = 6;
