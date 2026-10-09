"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

// Empties the cart once a cart checkout has been paid.
export default function ClearCart() {
  useEffect(() => clearCart(), []);
  return null;
}
