// Knowledge base for the customer-service assistant (/help).
// The assistant answers ONLY from these entries, so keep them accurate.
// DRAFT: the shipping, returns and payment entries are starting points. Replace them with your real policies.
import { formatPrice, products } from "@/lib/products";

export interface KnowledgeChunk {
  id: string;
  title: string;
  topic: "shipping" | "returns" | "care" | "materials" | "sizing" | "orders" | "custom" | "product";
  text: string;
}

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";

const policies: KnowledgeChunk[] = [
  {
    id: "shipping-times",
    title: "Shipping times",
    topic: "shipping",
    text: "Orders are packed and shipped within 2-4 business days. Standard international delivery usually takes 7-15 business days after shipping, depending on the destination and customs.",
  },
  {
    id: "shipping-cost",
    title: "Shipping cost and destinations",
    topic: "shipping",
    text: "We ship worldwide. Shipping cost is calculated at checkout based on the destination. Import duties or taxes charged by the destination country, if any, are paid by the customer.",
  },
  {
    id: "order-tracking",
    title: "Tracking an order",
    topic: "orders",
    text: `A tracking number is emailed when the order ships. If you have not received it within 5 business days of ordering, email ${contact} with your order number.`,
  },
  {
    id: "order-changes",
    title: "Changing or cancelling an order",
    topic: "orders",
    text: `Orders can be changed or cancelled free of charge before they ship. Email ${contact} with your order number as soon as possible. Once an order has shipped, it can no longer be cancelled, but it can be returned.`,
  },
  {
    id: "returns-window",
    title: "Returns",
    topic: "returns",
    text: `Unworn pieces in their original packaging can be returned within 30 days of delivery for a refund to the original payment method. Email ${contact} to start a return. Return shipping is paid by the customer unless the item arrived damaged or wrong. For hygiene reasons, earrings can only be returned if the seal is unopened.`,
  },
  {
    id: "returns-custom",
    title: "Returns on custom pieces",
    topic: "returns",
    text: "Custom-made and personalized pieces are made to order and cannot be returned, unless they arrive damaged or differ from the approved design.",
  },
  {
    id: "damaged-items",
    title: "Damaged, faulty or wrong items",
    topic: "returns",
    text: `If a piece arrives damaged, faulty or not as ordered, email ${contact} within 7 days of delivery with your order number and a photo. We will send a replacement or a full refund, including shipping.`,
  },
  {
    id: "materials-sterling",
    title: "925 sterling silver",
    topic: "materials",
    text: "925 sterling silver is 92.5% pure silver mixed with other metals for strength. It is hypoallergenic for most people. Silver naturally darkens (tarnishes) over time when exposed to air, and a polishing cloth restores the shine.",
  },
  {
    id: "materials-gold-plated",
    title: "Gold-plated jewelry",
    topic: "materials",
    text: "Gold-plated pieces have a thin layer of gold over a base metal (925 sterling silver or copper, as stated on each product). The plating can fade with heavy wear, friction, sweat and chemicals. With gentle care it keeps its color for a long time.",
  },
  {
    id: "materials-pearls",
    title: "Freshwater and natural pearls",
    topic: "materials",
    text: "Our pearls are real pearls, so each one has small natural variations in shape, size and luster. No two pieces are exactly alike. This is a sign of a genuine pearl, not a defect.",
  },
  {
    id: "materials-stones",
    title: "Moissanite, simulated diamond and clear stones",
    topic: "materials",
    text: "Moissanite is a lab-created gemstone with more sparkle than diamond and similar hardness. Simulated diamond and clear stones are diamond-look stones. None of our pieces contain natural diamonds.",
  },
  {
    id: "allergies",
    title: "Sensitive skin and allergies",
    topic: "materials",
    text: "Earring posts on our studs are designed for everyday wear. Sterling silver pieces are suitable for most sensitive skin. If you have a known metal allergy, check the metal listed on the product page, or email us before ordering.",
  },
  {
    id: "care-general",
    title: "Caring for your jewelry",
    topic: "care",
    text: "Put jewelry on last, after perfume, lotion and hairspray, and take it off first. Remove it before swimming, showering, exercising or cleaning. Wipe it with a soft dry cloth after wearing and store each piece separately in its pouch or a closed box to avoid scratches and tarnish.",
  },
  {
    id: "care-pearls",
    title: "Caring for pearls",
    topic: "care",
    text: "Pearls are soft and sensitive to chemicals. Wipe them with a soft, slightly damp cloth after wearing and let them dry flat. Never use jewelry cleaner, ultrasonic cleaners or brushes on pearls.",
  },
  {
    id: "care-cleaning-silver",
    title: "Cleaning tarnished silver or gold plating",
    topic: "care",
    text: "For sterling silver, use a silver polishing cloth. For gold-plated pieces, use only a soft dry cloth, as polishing cloths and cleaners can remove the plating. Avoid toothpaste and baking soda.",
  },
  {
    id: "sizing-necklaces",
    title: "Necklace length",
    topic: "sizing",
    text: "Our necklaces come on a fine cable chain. The exact chain length is listed in the product details when available. If you need a different length, email us before ordering and we will tell you what is possible.",
  },
  {
    id: "sizing-earrings",
    title: "Earring size and backs",
    topic: "sizing",
    text: "All our earrings are studs with post backs for pierced ears. We do not currently offer clip-on versions.",
  },
  {
    id: "custom-process",
    title: "Custom design process",
    topic: "custom",
    text: "Describe your idea on the Custom Design page. Our jeweler replies by email with questions, a quote and a timeline. Production starts only after you approve the design and quote.",
  },
  {
    id: "gift-card-service",
    title: "Gift cards and gift messages",
    topic: "orders",
    text: "Bought a piece as a gift? Use the Gift Card page to add a free handwritten-style card with your message. The page suggests message ideas, and you can write your own.",
  },
  {
    id: "payment",
    title: "Payment",
    topic: "orders",
    text: "Prices are in US dollars. Payment is taken securely at checkout.",
  },
];

// One chunk per product, so the assistant can answer "is X gold?" or "how much is Y?".
const productChunks: KnowledgeChunk[] = products.map((p) => ({
  id: `product-${p.id}`,
  title: p.name,
  topic: "product",
  text: `${p.name} (${p.category}), ${formatPrice(p.price)}. Metal: ${p.metal.replace("-", " ")}. Stone: ${p.stone ?? "none"}. ${p.description}`,
}));

export const knowledgeBase: KnowledgeChunk[] = [...policies, ...productChunks];
