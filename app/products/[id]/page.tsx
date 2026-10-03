import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import { formatPrice, getProduct, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getProduct((await params).id);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProduct((await params).id);
  if (!product) notFound();

  const metal = product.metal.replace("-", " ");
  return (
    <div className="page product">
      <ProductImage product={product} size={520} />
      <div>
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="price big">{formatPrice(product.price)}</p>
        <p>{product.description}</p>
        <p className="story">{product.story}</p>
        <ul className="specs">
          <li>Metal: {metal}</li>
          <li>Stone: {product.stone ?? "none"}</li>
        </ul>
        <div className="actions">
          <Link href="/advisor" className="btn btn-outline">Not sure? Ask the AI advisor</Link>
        </div>
      </div>
    </div>
  );
}
