import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import AuthOff from "@/components/AuthOff";
import ProductImage from "@/components/ProductImage";
import RefundButton from "@/components/RefundButton";
import { authEnabled } from "@/lib/auth";
import { deliveryWindow, loadOrders, type Order, type OrderStatus } from "@/lib/orders";

export const metadata = { title: "My orders" };

const STATUS_LABEL: Record<OrderStatus, string> = {
  preparing: "Preparing to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  return_requested: "Return requested",
  refunded: "Refunded",
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </ul>
      )}
      <p className="hint">Demo store in Stripe test mode, so no money was charged.</p>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [earliest, latest] = deliveryWindow(order.created);
  const canRefund = order.status === "preparing" || order.status === "shipped" || order.status === "delivered";
  return (
    <li className="order">
      <div className="order-head">
        <span>Ordered {day(new Date(order.created * 1000))}</span>
        <span className={`order-status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>
      {order.items.map((item, i) => (
        <div key={i} className="order-item">
          {item.product ? (
            <Link href={`/products/${item.product.id}`} className="order-thumb">
              <ProductImage product={item.product} size={96} />
            </Link>
          ) : (
            <div className="order-thumb" />
          )}
          <div>
            <p><strong>{item.name}</strong></p>
            <p className="hint">Qty {item.quantity} · {money(item.amount)}</p>
          </div>
        </div>
      ))}
      <dl className="order-details">
        <dt>Shipping</dt>
        <dd>
          {order.status === "preparing" && <>Standard shipping · arrives {day(earliest)} to {day(latest)}</>}
          {(order.status === "shipped" || order.status === "delivered") && (
            <>
              {order.carrier ? `${order.carrier} · ` : ""}Tracking number {order.trackingNumber}
            </>
          )}
          {order.status === "return_requested" && <>Return requested. We will email you return instructions.</>}
          {order.status === "refunded" && <>Refunded {money(order.refunded)} to your card.</>}
        </dd>
        {order.address && (
          <>
            <dt>Ships to</dt>
            <dd>{order.address}</dd>
          </>
        )}
        <dt>Total</dt>
        <dd>
          {money(order.total)}
          {order.shipping ? <span className="hint"> (incl. {money(order.shipping)} shipping)</span> : null}
        </dd>
      </dl>
      {canRefund && <RefundButton sessionId={order.id} shipped={order.status !== "preparing"} />}
    </li>
  );
}

async function findOrders(customer: string) {
  try {
    return await loadOrders(customer);
  } catch (error) {
    console.error("Could not load orders", error);
    return null;
  }
}
