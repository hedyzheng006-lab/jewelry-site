import Link from "next/link";
import ClearCart from "@/components/ClearCart";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Thank you" };

// Stripe sends the shopper here after paying. We look the session up on the server
// so the page only shows details Stripe has confirmed.
export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; cart?: string }>;
}) {
  const { session_id, cart } = await searchParams;
  const session = session_id?.startsWith("cs_") ? await findSession(session_id) : null;

  if (!session || session.payment_status !== "paid") {
    return (
      <div className="page">
        <h1>We could not find that order</h1>
        <p>If you just paid, check your email for a receipt.</p>
        <div className="actions"><Link href="/" className="btn">Back to the shop</Link></div>
      </div>
    );
  }

  const money = (cents: number | null) => `$${((cents ?? 0) / 100).toFixed(2)}`;
  const address = session.collected_information?.shipping_details?.address;
  return (
    <div className="page">
      {cart === "1" && <ClearCart />}
      <p className="eyebrow">Order confirmed</p>
      <h1>Thank you{session.customer_details?.name ? `, ${session.customer_details.name.split(" ")[0]}` : ""}!</h1>
      <p>A receipt is on its way to {session.customer_details?.email ?? "your email"}.</p>
      <div className="notice">
        <h2>Your order</h2>
        {session.line_items?.data.map((item) => (
          <p key={item.id}>{item.quantity} × {item.description} · {money(item.amount_total)}</p>
        ))}
        {session.total_details?.amount_shipping ? <p>Shipping · {money(session.total_details.amount_shipping)}</p> : null}
        <p><strong>Total · {money(session.amount_total)}</strong></p>
        {address && (
          <p>Ships to {[address.line1, address.city, address.state, address.postal_code, address.country].filter(Boolean).join(", ")}</p>
        )}
      </div>
      <p className="hint">This was a Stripe test-mode payment, so no money was charged.</p>
      <div className="actions"><Link href="/" className="btn btn-outline">Keep browsing</Link></div>
    </div>
  );
}

async function findSession(id: string) {
  try {
    return await getStripe().checkout.sessions.retrieve(id, { expand: ["line_items"] });
  } catch {
    return null;
  }
}
