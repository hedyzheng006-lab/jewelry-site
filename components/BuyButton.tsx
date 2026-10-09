"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { postJSON } from "@/lib/post";

// "Add to cart" keeps shopping; "Buy now" goes straight to Stripe's hosted checkout for this one product.
export default function BuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const { url } = await postJSON<{ url: string }>("/api/checkout", { items: [{ productId, quantity: 1 }] });
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  function add() {
    addToCart(productId);
    setAdded(true);
  }

  return (
    <div className="buy">
      <div className="buy-buttons">
        <button type="button" className="btn" onClick={add}>
          Add to cart
        </button>
        <button type="button" className="btn btn-outline" onClick={buy} disabled={loading}>
          {loading ? "Opening checkout…" : "Buy now"}
        </button>
      </div>
      {added && (
        <p className="added">
          Added to your cart. <Link href="/cart" className="link">View cart</Link>
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <p className="hint">
        Demo store in Stripe test mode, no real charge. Pay with card 4242 4242 4242 4242, any future date and any CVC.
      </p>
    </div>
  );
}
