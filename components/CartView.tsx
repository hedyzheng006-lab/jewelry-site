"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import { MAX_QUANTITY, setQuantity, useCart } from "@/lib/cart";
import { postJSON } from "@/lib/post";
import { formatPrice, getProduct } from "@/lib/products";
import { SHIPPING_FLAT_USD } from "@/lib/shipping";

export default function CartView() {
  const cart = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drop anything no longer in the catalog.
  const lines = cart.flatMap((i) => {
    const product = getProduct(i.productId);
    return product ? [{ product, quantity: i.quantity }] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const items = lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
      const { url } = await postJSON<{ url: string }>("/api/checkout", { items, fromCart: true });
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return (
      <>
        <p>Your cart is empty.</p>
        <div className="actions"><Link href="/" className="btn">Browse the collection</Link></div>
      </>
    );
  }

  return (
    <>
      <ul className="cart">
        {lines.map(({ product, quantity }) => (
          <li key={product.id} className="cart-line">
            <Link href={`/products/${product.id}`} className="order-thumb">
              <ProductImage product={product} size={96} />
            </Link>
            <div className="cart-info">
              <Link href={`/products/${product.id}`}><strong>{product.name}</strong></Link>
              <p className="hint">{formatPrice(product.price)} each</p>
              <div className="qty">
                <button type="button" aria-label="Fewer" onClick={() => setQuantity(product.id, quantity - 1)}>−</button>
                <span aria-label="Quantity">{quantity}</span>
                <button
                  type="button"
                  aria-label="More"
                  onClick={() => setQuantity(product.id, quantity + 1)}
                  disabled={quantity >= MAX_QUANTITY}
                >
                  +
                </button>
                <button type="button" className="remove" onClick={() => setQuantity(product.id, 0)}>Remove</button>
              </div>
            </div>
            <p className="cart-amount">{formatPrice(product.price * quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="cart-summary">
        <dt>Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
        <dt>Shipping</dt>
        <dd>{formatPrice(SHIPPING_FLAT_USD)}</dd>
        <dt><strong>Total</strong></dt>
        <dd><strong>{formatPrice(subtotal + SHIPPING_FLAT_USD)}</strong></dd>
      </dl>
      <div className="cart-actions">
        <Link href="/" className="btn btn-outline">Keep shopping</Link>
        <button type="button" className="btn" onClick={checkout} disabled={loading}>
          {loading ? "Opening checkout…" : "Checkout"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <p className="hint">
        Demo store in Stripe test mode, no real charge. Pay with card 4242 4242 4242 4242, any future date and any CVC.
      </p>
    </>
  );
}
