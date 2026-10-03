// Sample catalog. Replace with real products (and real photos in /public/products).
export type Category = "necklace" | "earrings";
export type Metal = "gold" | "gold-plated" | "silver" | "rose-gold";

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
    id: "constellation-chain",
    name: "Constellation Chain",
    category: "necklace",
    metal: "silver",
    stone: "cubic zirconia",
    stoneColor: "#f2f4f8",
    price: 85,
    description: "A delicate silver chain scattered with tiny stones, like stars.",
    story: "For the ones who make wishes. Layers well with other chains.",
    tags: ["layering", "everyday", "dainty", "affordable"],
  },
  {
    id: "ruby-heart",
    name: "Ruby Heart Necklace",
    category: "necklace",
    metal: "gold",
    stone: "ruby",
    stoneColor: "#b3203a",
    price: 390,
    description: "A small heart-cut ruby on a 14k gold cable chain.",
    story: "July's birthstone in the simplest shape of love.",
    tags: ["romantic", "birthstone-july", "valentine", "gift"],
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
