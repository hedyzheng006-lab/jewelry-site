import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products, type Category } from "@/lib/products";

const sections: { key: Category; label: string }[] = [
  { key: "earrings", label: "Earrings" },
  { key: "necklace", label: "Necklaces" },
];

const tools = [
  { href: "/advisor", title: "AI Jewelry Advisor", text: "Tell us the occasion, budget and style. Get picks from our collection with reasons." },
  { href: "/gift", title: "Gift Card", text: "Bought a piece as a gift? Add a free card. Get 8 message ideas, pick one or make it your own." },
  { href: "/custom", title: "Custom Design", text: "Describe the piece you imagine and send it to our jeweler. Get an AI concept sketch while you wait." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Handcrafted fine jewelry</p>
        <h1>Pieces made to mark the moments that matter</h1>
      </section>

      {sections.map((s) => (
        <section key={s.key} id={s.key} className="section">
          <h2>{s.label}</h2>
          <div className="grid">
            {products.filter((p) => p.category === s.key).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}

      <section className="section">
        <h2>Find your piece with AI</h2>
        <div className="tools">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="tool">
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <span className="link">Try it →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
