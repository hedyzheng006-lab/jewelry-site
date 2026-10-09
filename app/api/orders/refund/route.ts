import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { authEnabled } from "@/lib/auth";
import { loadOrder } from "@/lib/orders";
import { CheckoutError, getStripe } from "@/lib/stripe";

const Input = z.object({
  sessionId: z.string().startsWith("cs_").max(200),
  reason: z.string().trim().max(500).optional().default(""),
});

// Refund requests from /orders, following the store policy in lib/knowledge.ts:
// an order that has not shipped yet is cancelled and refunded right away; a shipped
// order gets a return request that the owner approves by refunding it in Stripe.
export async function POST(req: Request) {
  const user = authEnabled ? await currentUser() : null;
  if (!user) return Response.json({ error: "Please log in first." }, { status: 401 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  const customer = user.privateMetadata.stripeCustomerId;
  if (!parsed.success || typeof customer !== "string") {
    return Response.json({ error: "That order could not be found." }, { status: 400 });
  }

  try {
    const found = await loadOrder(customer, parsed.data.sessionId);
    if (!found) return Response.json({ error: "That order could not be found." }, { status: 404 });
    const { order, paymentIntent } = found;
    const stripe = getStripe();

    if (order.status === "refunded" || order.status === "return_requested") {
      return Response.json({ error: "A refund is already in progress for this order." }, { status: 409 });
    }
    if (order.status === "preparing") {
      await stripe.refunds.create(
        { payment_intent: paymentIntent.id, reason: "requested_by_customer", metadata: { note: parsed.data.reason } },
        { idempotencyKey: `cancel-${paymentIntent.id}` },
      );
      return Response.json({ status: "refunded" });
    }
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { return_requested: new Date().toISOString(), return_reason: parsed.data.reason },
    });
    return Response.json({ status: "return_requested" });
  } catch (error) {
    if (error instanceof CheckoutError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Refund request failed", error);
    return Response.json({ error: "Could not submit the request. Please try again." }, { status: 502 });
  }
}
