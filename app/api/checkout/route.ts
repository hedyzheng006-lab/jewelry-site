import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { authEnabled } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { CheckoutError, getStripe, SHIPPING_COUNTRIES, SHIPPING_FLAT_USD } from "@/lib/stripe";

const Input = z.object({
  productId: z.string().max(100),
  quantity: z.number().int().min(1).max(5).optional().default(1),
});

// Creates a Stripe Checkout session for one product and returns the hosted payment page URL.
// The price always comes from lib/products.ts on the server, never from the browser.
export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  const product = parsed.success ? getProduct(parsed.data.productId) : undefined;
  if (!parsed.success || !product) {
    return Response.json({ error: "That product could not be found." }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  // When the shopper is signed in, tag the order with their account so it shows on /orders.
  const user = authEnabled ? await currentUser() : null;
  const userTag: Record<string, string> = user ? { userId: user.id } : {};
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: parsed.data.quantity,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: product.name,
              description: product.description,
              ...(product.image ? { images: [new URL(product.image, origin).toString()] } : {}),
            },
          },
        },
      ],
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
      metadata: { productId: product.id, ...userTag },
      payment_intent_data: {
        description: `${parsed.data.quantity} × ${product.name}`,
        metadata: { productId: product.id, ...userTag },
      },
      ...(user ? { client_reference_id: user.id } : {}),
      ...(user?.primaryEmailAddress ? { customer_email: user.primaryEmailAddress.emailAddress } : {}),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products/${product.id}`,
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
