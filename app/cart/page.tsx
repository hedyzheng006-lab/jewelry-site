import CartView from "@/components/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="page narrow">
      <h1>Your cart</h1>
      <CartView />
    </div>
  );
}
