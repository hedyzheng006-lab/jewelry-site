// Sample catalog. Replace with real products (and real photos in /public/products).
export type Category = "ring" | "necklace" | "earrings" | "bracelet";
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
    id: "dawn-solitaire",
    name: "Dawn Solitaire Ring",
    category: "ring",
    metal: "gold",
    stone: "white sapphire",
    stoneColor: "#e8eef5",
    price: 420,
    description: "A single round white sapphire held in a slim 14k gold band.",
    story: "Made for the first light of a new chapter: engagements, promotions, fresh starts.",
    tags: ["minimal", "engagement", "everyday", "classic"],
  },
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
    id: "rose-garden-pendant",
    name: "Rose Garden Pendant",
    category: "necklace",
    metal: "rose-gold",
    stone: "pink tourmaline",
    stoneColor: "#e79bb4",
    price: 260,
    description: "A pear-cut pink tourmaline on a fine rose gold chain, 18 inches.",
    story: "Pink tourmaline is said to carry love and compassion. A gentle gift for someone dear.",
    tags: ["romantic", "gift", "anniversary", "feminine"],
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
    id: "linked-cuff",
    name: "Linked Cuff Bracelet",
    category: "bracelet",
    metal: "silver",
    stone: null,
    stoneColor: null,
    price: 150,
    description: "An open sterling silver cuff made of interlocking links.",
    story: "Two halves that hold together. A favorite for friendship and partnership gifts.",
    tags: ["bold", "friendship", "unisex", "modern"],
  },
  {
    id: "emerald-halo",
    name: "Emerald Halo Ring",
    category: "ring",
    metal: "gold",
    stone: "emerald",
    stoneColor: "#1f8a5b",
    price: 680,
    description: "An oval emerald surrounded by a halo of small white sapphires, 18k gold.",
    story: "May's birthstone, framed like a small garden. A statement for milestone moments.",
    tags: ["statement", "birthstone-may", "luxury", "anniversary"],
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
    id: "amethyst-bar",
    name: "Amethyst Bar Bracelet",
    category: "bracelet",
    metal: "rose-gold",
    stone: "amethyst",
    stoneColor: "#8a5cc2",
    price: 135,
    description: "A slim rose gold bar set with three small amethysts on an adjustable chain.",
    story: "February's birthstone, long linked with calm and clarity.",
    tags: ["dainty", "birthstone-february", "gift", "calm"],
  },
  {
    id: "signet-classic",
    name: "Classic Signet Ring",
    category: "ring",
    metal: "silver",
    stone: null,
    stoneColor: null,
    price: 110,
    description: "A heavy sterling silver signet with a flat face, ready for engraving.",
    story: "A ring meant to carry initials, dates or a small symbol that matters to you.",
    tags: ["engravable", "unisex", "classic", "personalized"],
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

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

// Compact catalog text that is sent to Claude so it only recommends real items.
export function catalogForPrompt(): string {
  return products
    .map(
      (p) =>
        `- id: ${p.id} | ${p.name} | ${p.category} | ${p.metal}${p.stone ? ` + ${p.stone}` : ""} | $${p.price} | ${p.description} | tags: ${p.tags.join(", ")}`,
    )
    .join("\n");
}
