"use client";

import { useSyncExternalStore } from "react";

// Shopping cart kept in the browser (localStorage), so it works for guests and
// needs no database. Prices are never stored here: checkout reads them from
// lib/products.ts on the server.
export interface CartItem {
  productId: string;
  quantity: number;
}

import { MAX_QUANTITY } from "@/lib/cart-limits";

export { MAX_QUANTITY };
const KEY = "cart";
const EVENT = "cart-change";
const EMPTY: CartItem[] = [];
let cached: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cached.raw) return cached.items;
  let items: CartItem[] = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) items = parsed.filter((i) => typeof i?.productId === "string" && i.quantity > 0);
  } catch {}
  cached = { raw, items };
  return items;
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addToCart(productId: string, quantity = 1) {
  const items = read();
  const existing = items.find((i) => i.productId === productId);
  const next = existing
    ? items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i))
    : [...items, { productId, quantity: Math.min(MAX_QUANTITY, quantity) }];
  write(next);
}

export function setQuantity(productId: string, quantity: number) {
  const q = Math.max(0, Math.min(MAX_QUANTITY, quantity));
  write(read().flatMap((i) => (i.productId !== productId ? [i] : q > 0 ? [{ ...i, quantity: q }] : [])));
}

export function clearCart() {
  write([]);
}
