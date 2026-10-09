"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";

// Sends the shopper to Stripe's hosted checkout page for this product.
export default function BuyButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const { url } = await postJSON<{ url: string }>("/api/checkout", { productId });
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="buy">
      <button type="button" className="btn" onClick={buy} disabled={loading}>
        {loading ? "Opening checkout…" : "Buy now"}
      </button>
      {error && <p className="error">{error}</p>}
      <p className="hint">
        Demo store in Stripe test mode, no real charge. Pay with card 4242 4242 4242 4242, any future date and any CVC.
      </p>
    </div>
  );
}
