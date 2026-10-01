import Link from "next/link";
import type { Product } from "@/lib/products";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, note }: { product: Product; note?: string }) {
  return (
    <Link href={`/products/${product.id}`} className="card">
      <ProductImage product={product} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="price">${product.price}</p>
        {note && <p className="note">{note}</p>}
      </div>
    </Link>
  );
}
