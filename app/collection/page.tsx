import ProductCard from "@/components/ProductCard";
import { products, type Category } from "@/lib/products";

export const metadata = { title: "Collection" };

const sections: { key: Category; label: string }[] = [
  { key: "earrings", label: "Earrings" },
  { key: "necklace", label: "Necklaces" },
];

export default function Collection() {
  return (
    <div className="page">
      <h1>The Collection</h1>
      {sections.map((s) => (
        <section key={s.key} className="section">
          <h2>{s.label}</h2>
          <div className="grid">
            {products.filter((p) => p.category === s.key).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
