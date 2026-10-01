import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

const featured = ["rose-garden-pendant", "dawn-solitaire", "midnight-studs", "linked-cuff"];

const tools = [
  { href: "/advisor", title: "AI Jewelry Advisor", text: "Tell us the occasion, budget and style. Get picks from our collection with reasons." },
  { href: "/gift", title: "Gift Finder", text: "Answer a few questions about them. Get gift ideas and a card message ready to write." },
  { href: "/custom", title: "Custom Design", text: "Describe the piece you imagine. See a concept sketch and a design brief for our jeweler." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Handcrafted fine jewelry</p>
        <h1>Pieces made to mark the moments that matter</h1>
        <p className="lead">Small-batch rings, necklaces and earrings, and an AI advisor that helps you find the one.</p>
        <div className="actions">
          <Link href="/collection" className="btn">Shop the collection</Link>
          <Link href="/advisor" className="btn btn-outline">Ask the AI advisor</Link>
        </div>
      </section>

      <section className="section">
        <h2>Featured</h2>
        <div className="grid">
          {featured.map((id) => {
            const p = products.find((x) => x.id === id)!;
            return <ProductCard key={id} product={p} />;
          })}
        </div>
      </section>

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
