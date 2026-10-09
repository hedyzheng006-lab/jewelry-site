import Link from "next/link";
import AuthOff from "@/components/AuthOff";
import { authEnabled, currentUserId } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "My orders" };

// Lists the signed-in shopper's paid orders. Checkout tags each payment with the
// Clerk user id, so we can find them with Stripe search; no database needed.
export default async function Orders() {
  if (!authEnabled) return <AuthOff />;
  const userId = await currentUserId();
  if (!userId) return null; // proxy.ts already sends signed-out visitors to /sign-in

  const orders = await findOrders(userId);
  return (
    <div className="page narrow">
      <p className="eyebrow">Your account</p>
      <h1>My orders</h1>
      {orders === null ? (
        <p className="error">Orders could not be loaded right now. Please try again later.</p>
      ) : orders.length === 0 ? (
        <>
          <p>No orders yet. New orders can take about a minute to show up here.</p>
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

async function findOrders(userId: string) {
  try {
    const result = await getStripe().paymentIntents.search({
      query: `metadata['userId']:'${userId.replace(/[^\w]/g, "")}' AND status:'succeeded'`,
      limit: 50,
    });
    return result.data.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error("Could not load orders", error);
    return null;
  }
}
