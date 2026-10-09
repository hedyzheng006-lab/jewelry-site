"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

// Header link to the cart with the number of pieces in it.
export default function CartLink() {
  const count = useCart().reduce((n, i) => n + i.quantity, 0);
  return (
    <Link href="/cart" className="cart-link">
      Cart{count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
