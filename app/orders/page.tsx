import Link from "next/link";
import AuthOff from "@/components/AuthOff";
import { currentUser } from "@clerk/nextjs/server";
import { authEnabled } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "My orders" };

// Lists the signed-in shopper's paid orders straight from Stripe, so no database is needed.
// Checkout attaches each signed-in order to the shopper's Stripe customer.
export default async function Orders() {
  if (!authEnabled) return <AuthOff />;
  const user = await currentUser();
  if (!user) return null; // proxy.ts already sends signed-out visitors to /sign-in

  const customer = user.privateMetadata.stripeCustomerId;
  const orders = typeof customer === "string" ? await findOrders(customer) : [];
  return (
    <div className="page narrow">
      <p className="eyebrow">Your account</p>
      <h1>My orders</h1>
      {orders === null ? (
        <p className="error">Orders could not be loaded right now. Please try again later.</p>
      ) : orders.length === 0 ? (
        <>
          <p>No orders yet.</p>
          <div className="actions"><Link href="/" className="btn">Browse the collection</Link></div>
        </>
      ) : (
        <ul className="orders">
          {orders.map((o) => (
            <li key={o.id} className="notice">
              <p><strong>{o.description || "Order"}</strong></p>
              <p className="hint">
                {new Date(o.created * 1000).toLocaleDateString("en-US", { dateStyle: "medium" })} · $
                {(o.amount / 100).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">Demo store in Stripe test mode, so no money was charged.</p>
    </div>
  );
}

async function findOrders(customer: string) {
  try {
    const sessions = await getStripe().checkout.sessions.list({
      customer,
      status: "complete",
      limit: 50,
      expand: ["data.line_items"],
    });
    return sessions.data
      .filter((s) => s.payment_status === "paid")
      .map((s) => ({
        id: s.id,
        created: s.created,
        amount: s.amount_total ?? 0,
        description: s.line_items?.data.map((item) => `${item.quantity} × ${item.description}`).join(", ") ?? "",
      }));
  } catch (error) {
    console.error("Could not load orders", error);
    return null;
  }
}
