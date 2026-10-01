import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";
import { catalogForPrompt, products } from "@/lib/products";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

const Output = z.object({
  reply: z.string().describe("Friendly answer to the shopper, 2-5 sentences, no markdown"),
  productIds: z.array(z.string()).describe("Ids of up to 3 recommended products from the catalog, best first"),
});

const SYSTEM = `You are the jewelry advisor for ${BRAND_NAME}, an independent jewelry brand.
Help shoppers find a piece for their occasion, budget and style.

Rules:
- Only recommend products from the catalog below, by id. Never invent products, prices or materials.
- Respect the budget. If nothing fits, say so honestly and suggest the closest option.
- If the request is vague, recommend your best guesses and ask one short follow-up question.
- Questions unrelated to jewelry: politely steer back to jewelry.

Catalog:
${catalogForPrompt()}`;

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  try {
    const result = await askClaude({ system: SYSTEM, messages: parsed.data.messages, schema: Output });
    const known = new Set(products.map((p) => p.id));
    return Response.json({
      reply: result.reply,
      productIds: result.productIds.filter((id) => known.has(id)).slice(0, 3),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
