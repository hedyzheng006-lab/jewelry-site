import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { askClaude, BRAND_NAME } from "@/lib/claude";
import { catalogForPrompt } from "@/lib/products";

export const AdvisorOutput = z.object({
  reply: z.string().describe("Friendly answer to the shopper, 2-5 sentences, no markdown"),
  productIds: z.array(z.string()).describe("Ids of up to 3 recommended products from the catalog, best first"),
});

export type AdvisorResult = z.infer<typeof AdvisorOutput>;

const SYSTEM = `You are the jewelry advisor for ${BRAND_NAME}, an independent jewelry brand.
Help shoppers find a piece for their occasion, budget and style.

Rules:
- Only recommend products from the catalog below, by id. Never invent products, prices or materials.
- Respect the budget. If nothing fits, say so honestly and suggest the closest option.
- If the request is vague, recommend your best guesses and ask one short follow-up question.
- Questions unrelated to jewelry: politely steer back to jewelry.

Catalog:
${catalogForPrompt()}`;

/** Raw model output, before the route filters unknown ids. The evals grade this. */
export function runAdvisor(messages: Anthropic.Beta.BetaMessageParam[]): Promise<AdvisorResult> {
  return askClaude({ system: SYSTEM, messages, schema: AdvisorOutput });
}
