import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";
import { catalogForPrompt, products } from "@/lib/products";

const Input = z.object({
  relationship: z.string().max(100),
  occasion: z.string().max(100),
  budget: z.string().max(50),
  style: z.string().max(300),
  notes: z.string().max(1000).optional().default(""),
});

const Output = z.object({
  summary: z.string().describe("One sentence on what kind of gift fits this person"),
  picks: z
    .array(
      z.object({
        productId: z.string(),
        reason: z.string().describe("Why this suits the recipient, 1-2 sentences"),
      }),
    )
    .describe("2 or 3 products from the catalog, best first"),
  cardMessages: z
    .array(z.string())
    .describe("3 short gift card messages in different tones: heartfelt, playful, simple"),
});

const SYSTEM = `You are the gift concierge for ${BRAND_NAME}, an independent jewelry brand.
Given details about a gift recipient, pick the best pieces and write gift card messages.

Rules:
- Only pick products from the catalog below, by id. Never invent products.
- Stay within the budget when possible; if nothing fits, pick the closest and say so in the summary.
- Card messages should be warm, specific to the occasion, and under 40 words each. No placeholder names.

Catalog:
${catalogForPrompt()}`;

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const d = parsed.data;

  const prompt = `Recipient: my ${d.relationship}
Occasion: ${d.occasion}
Budget: ${d.budget}
Their style: ${d.style}
Other notes: ${d.notes || "none"}`;

  try {
    const result = await askClaude({
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      schema: Output,
    });
    const known = new Set(products.map((p) => p.id));
    return Response.json({ ...result, picks: result.picks.filter((p) => known.has(p.productId)).slice(0, 3) });
  } catch (error) {
    return errorResponse(error);
  }
}
