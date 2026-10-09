import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { authEnabled, stripeCustomerId } from "@/lib/auth";
import { MAX_QUANTITY } from "@/lib/cart-limits";
import { getProduct, type Product } from "@/lib/products";
import { CheckoutError, getStripe, SHIPPING_COUNTRIES, SHIPPING_FLAT_USD } from "@/lib/stripe";

const Input = z.object({
  items: z
    .array(z.object({ productId: z.string().max(100), quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
    .min(1)
    .max(20),
  fromCart: z.boolean().optional().default(false),
});

// Creates a Stripe Checkout session for the cart (or one "Buy now" product) and returns
// the hosted payment page URL. Prices always come from lib/products.ts on the server,
// never from the browser.
export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  const lines = parsed.success
    ? parsed.data.items.map((i) => ({ product: getProduct(i.productId), quantity: i.quantity }))
    : [];
  if (!parsed.success || lines.some((l) => !l.product)) {
    return Response.json({ error: "That product could not be found." }, { status: 400 });
  }
  const items = lines as { product: Product; quantity: number }[];
  const productIds = items.map((i) => i.product.id).join(",");

  const origin = new URL(req.url).origin;
  // When the shopper is signed in, tag the order with their account so it shows on /orders.
  const user = authEnabled ? await currentUser() : null;
  const userTag: Record<string, string> = user ? { userId: user.id } : {};
  try {
    const stripe = getStripe();
    const customer = user ? await stripeCustomerId(stripe, user) : undefined;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: product.description,
            ...(product.image ? { images: [new URL(product.image, origin).toString()] } : {}),
          },
        },
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Standard shipping",
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_FLAT_USD * 100, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 7 },
              maximum: { unit: "business_day", value: 15 },
            },
          },
        },
      ],
      metadata: { productIds, ...userTag },
      payment_intent_data: {
        description: items.map((i) => `${i.quantity} × ${i.product.name}`).join(", ").slice(0, 1000),
        metadata: { productIds, ...userTag },
      },
      ...(user && customer ? { client_reference_id: user.id, customer } : {}),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}${parsed.data.fromCart ? "&cart=1" : ""}`,
      cancel_url: parsed.data.fromCart ? `${origin}/cart` : `${origin}/products/${items[0].product.id}`,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Stripe checkout failed", error);
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
