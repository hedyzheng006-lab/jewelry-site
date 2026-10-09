import type Stripe from "stripe";
import { getProduct, type Product } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

// Orders live in Stripe, so the shop owner manages them from the Stripe dashboard:
// to mark an order shipped, open the payment and add metadata `tracking_number`
// (and optionally `carrier`, plus `delivered` = `true` once it arrives).

export type OrderStatus = "preparing" | "shipped" | "delivered" | "return_requested" | "refunded";

export interface Order {
  id: string; // Checkout session id
  created: number;
  total: number; // cents
  shipping: number; // cents
  items: { name: string; quantity: number; amount: number; product?: Product }[];
  address: string | null;
  status: OrderStatus;
  carrier: string | null;
  trackingNumber: string | null;
  refunded: number; // cents
}

export const DELIVERY_DAYS = { min: 7, max: 15 }; // business days, as on the Stripe checkout page

export async function loadOrders(customer: string): Promise<Order[]> {
  const sessions = await getStripe().checkout.sessions.list({
    customer,
    status: "complete",
    limit: 50,
    expand: ["data.line_items", "data.payment_intent.latest_charge"],
  });
  return sessions.data.filter((s) => s.payment_status === "paid").map(toOrder);
}

// Fetches one order, only if it belongs to this Stripe customer.
export async function loadOrder(customer: string, sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "payment_intent.latest_charge"],
  });
  if (session.customer !== customer || session.payment_status !== "paid") return null;
  return { order: toOrder(session), paymentIntent: session.payment_intent as Stripe.PaymentIntent };
}

function toOrder(s: Stripe.Checkout.Session): Order {
  const pi = s.payment_intent as Stripe.PaymentIntent | null;
  const charge = pi?.latest_charge as Stripe.Charge | null | undefined;
  const meta = pi?.metadata ?? {};
  const refunded = charge?.amount_refunded ?? 0;
  const trackingNumber = meta.tracking_number || null;

  let status: OrderStatus = "preparing";
  if (refunded > 0) status = "refunded";
  else if (meta.return_requested) status = "return_requested";
  else if (meta.delivered === "true") status = "delivered";
  else if (trackingNumber) status = "shipped";

  const productId = s.metadata?.productId;
  const a = s.collected_information?.shipping_details?.address;
  return {
    id: s.id,
    created: s.created,
    total: s.amount_total ?? 0,
    shipping: s.total_details?.amount_shipping ?? 0,
    items: (s.line_items?.data ?? []).map((item) => ({
      name: item.description ?? "Item",
      quantity: item.quantity ?? 1,
      amount: item.amount_total,
      product: productId ? getProduct(productId) : undefined,
    })),
    address: a ? [a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ") : null,
    status,
    carrier: meta.carrier || null,
    trackingNumber,
    refunded,
  };
}

// Estimated delivery window, counting business days from the order date.
export function deliveryWindow(created: number): [Date, Date] {
  return [addBusinessDays(created, DELIVERY_DAYS.min), addBusinessDays(created, DELIVERY_DAYS.max)];
}

function addBusinessDays(unixSeconds: number, days: number): Date {
  const d = new Date(unixSeconds * 1000);
  while (days > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days--;
  }
  return d;
}
