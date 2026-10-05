// Sample catalog. Replace with real products (and real photos in /public/products).
export type Category = "necklace" | "earrings";
export type Metal = "gold" | "gold-plated" | "silver" | "silver-tone" | "rose-gold";

export interface Product {
  id: string;
  name: string;
  category: Category;
  metal: Metal;
  stone: string | null;
  // Hex color of the main stone, used by the placeholder image
  stoneColor: string | null;
  price: number; // USD
  description: string;
  story: string;
  tags: string[];
  // Optional real photo path, e.g. "/products/ring-01.jpg"
  image?: string;
}

export const products: Product[] = [
  {
    id: "pearl-loop-studs",
    name: "Pearl Loop Studs",
    category: "earrings",
    metal: "gold-plated",
    stone: "freshwater pearl",
    stoneColor: "#f4efe6",
    price: 25,
    description: "Two round pearls nestled beneath a sleek gold-plated teardrop loop, on post backs.",
    story: "A modern twist on the classic pearl stud. Light enough for every day, polished enough for evenings out.",
    tags: ["everyday", "pearl", "minimal", "gift", "affordable", "birthstone-june"],
    image: "/products/pearl-loop-studs.png",
  },
  {
    id: "pearl-halo-necklace",
    name: "Pearl Halo Necklace",
    category: "necklace",
    metal: "gold-plated",
    stone: "freshwater pearl, 0.21 ct moissanite",
    stoneColor: "#f4efe6",
    price: 39.9,
    description: "A round freshwater pearl framed by a crescent of sparkling moissanite (0.21 ct total), on a fine cable chain. 925 sterling silver, gold-plated.",
    story: "A little halo of light around a single pearl, delicate enough to wear every day and pretty enough for special occasions.",
    tags: ["pearl", "moissanite", "sparkle", "dainty", "everyday", "gift", "bridal", "birthstone-june"],
    image: "/products/pearl-halo-necklace.png",
  },
  {
    id: "pearl-teardrop-studs",
    name: "Pearl Teardrop Studs",
    category: "earrings",
    metal: "gold-plated",
    stone: "freshwater pearl",
    stoneColor: "#f4efe6",
    price: 25,
    description: "A single round pearl cradled in an open gold-plated teardrop frame, on post backs.",
    story: "Soft curves and one luminous pearl. Simple enough for every day, graceful enough for a wedding guest look.",
    tags: ["everyday", "pearl", "minimal", "gift", "affordable", "bridal", "birthstone-june"],
    image: "/products/pearl-teardrop-studs.png",
  },
  {
    id: "pearl-nest-studs",
    name: "Pearl Nest Studs",
    category: "earrings",
    metal: "gold-plated",
    stone: "freshwater pearl",
    stoneColor: "#f4efe6",
    price: 30,
    description: "A lustrous button pearl wrapped in fine gold-plated wire, coiled like a little nest, on post backs.",
    story: "Fine wire swirls around the pearl like a little nest, a soft, textured take on the classic pearl stud.",
    tags: ["textured", "pearl", "statement", "classic", "gift", "bridal", "birthstone-june"],
    image: "/products/pearl-nest-studs.png",
  },
  {
    id: "pearl-crossbar-necklace",
    name: "Pearl Crossbar Necklace",
    category: "necklace",
    metal: "silver",
    stone: "freshwater pearl, 5 mm simulated diamond",
    stoneColor: "#f2f4f8",
    price: 39.9,
    description: "Two crossed bars, one lined with tiny sparkling stones, finished with a freshwater pearl and a 5 mm high-carbon simulated diamond. 925 sterling silver.",
    story: "Two lines that meet and hold, with a pearl and a bright stone at either end. A modern piece with a quiet sense of balance.",
    tags: ["pearl", "sparkle", "modern", "everyday", "gift", "silver", "birthstone-june"],
    image: "/products/pearl-crossbar-necklace.png",
  },
  {
    id: "pearl-smile-necklace",
    name: "Pearl Smile Necklace",
    category: "necklace",
    metal: "gold-plated",
    stone: "natural pearl, clear stones",
    stoneColor: "#f4efe6",
    price: 31.9,
    description: "A gently curved bar set with nine sparkling clear stones, with seven natural pearls hanging beneath, on a fine cable chain. Gold-plated.",
    story: "A soft curve of light and pearls that sits like a smile at the collarbone. Elegant for occasions, easy for every day.",
    tags: ["pearl", "sparkle", "elegant", "everyday", "gift", "bridal", "birthstone-june"],
    image: "/products/pearl-smile-necklace.png",
  },
  {
    id: "seven-pearl-necklace",
    name: "Seven Pearl Necklace",
    category: "necklace",
    metal: "silver",
    stone: "natural pearl",
    stoneColor: "#f4efe6",
    price: 39.9,
    description: "Seven round natural pearls in a soft curve on a fine chain. 925 sterling silver.",
    story: "A gentle arc of pearls that frames the neckline. Timeless and clean, easy to layer or wear on its own.",
    tags: ["pearl", "classic", "minimal", "everyday", "gift", "bridal", "silver", "birthstone-june"],
    image: "/products/seven-pearl-necklace.png",
  },
  {
    id: "balance-pearl-smile-pendant",
    name: "Balance Graduated Pearl Smile Pendant",
    category: "necklace",
    metal: "silver-tone",
    stone: "freshwater pearl, clear stones",
    stoneColor: "#f4efe6",
    price: 32.9,
    description: "From our Balance collection: a slim curved bar lined with tiny sparkling clear stones, with five freshwater pearls graduating in size beneath, on a fine silver-tone cable chain.",
    story: "Pearls that grow from small to large along a gentle curve, a quiet smile of light at the neckline.",
    tags: ["pearl", "sparkle", "elegant", "everyday", "gift", "bridal", "birthstone-june"],
    image: "/products/balance-pearl-smile-pendant.png",
  },
  {
    id: "balance-pearl-smile-pendant-gold",
    name: "Balance Graduated Pearl Smile Pendant (Gold)",
    category: "necklace",
    metal: "gold-plated",
    stone: "freshwater pearl, clear stones",
    stoneColor: "#f4efe6",
    price: 32.9,
    description: "From our Balance collection: a slim curved bar lined with tiny sparkling clear stones, with five freshwater pearls graduating in size beneath, on a fine cable chain. Gold-plated copper.",
    story: "The warm gold version of our Balance pendant. Pearls grow from small to large along a gentle curve, a quiet smile of light at the neckline.",
    tags: ["pearl", "sparkle", "elegant", "everyday", "gift", "bridal", "birthstone-june"],
    image: "/products/balance-pearl-smile-pendant-gold.png",
  },
];

// $25 stays "$25"; $39.9 shows as "$39.90".
export function formatPrice(price: number): string {
  return `$${Number.isInteger(price) ? price : price.toFixed(2)}`;
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

// Compact catalog text that is sent to Claude so it only recommends real items.
export function catalogForPrompt(): string {
  return products
    .map(
      (p) =>
        `- id: ${p.id} | ${p.name} | ${p.category} | ${p.metal}${p.stone ? ` + ${p.stone}` : ""} | ${formatPrice(p.price)} | ${p.description} | tags: ${p.tags.join(", ")}`,
    )
    .join("\n");
}
