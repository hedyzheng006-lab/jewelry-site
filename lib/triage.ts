// Triage agent for incoming custom-design requests.
//
// An agent is a loop: Claude reads the request, decides which tool it needs
// (search the catalog, check what the workshop can make, estimate a price),
// we run that tool and send the result back, and it repeats until Claude
// calls `submit_triage` with its final assessment. Every step is recorded
// so the owner can see how the decision was made. Nothing is sent to the
// customer: the reply is a draft for the owner to approve.
//
// DRAFT: WORKSHOP and PRICING below are example numbers. Replace them with the real ones.
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BRAND_NAME, client, MODEL, RefusalError } from "@/lib/claude";
import { formatPrice, products } from "@/lib/products";

const WORKSHOP = {
  metals: ["925 sterling silver", "gold-plated sterling silver", "gold-plated copper"],
  stones: ["freshwater pearl", "natural pearl", "moissanite", "simulated diamond", "clear cubic zirconia"],
  pieceTypes: ["necklace", "pendant", "earrings"],
  engraving: "Up to 20 characters on a pendant or bar, script or block letters.",
  chainLengths: "16, 18 or 20 inches.",
  notOffered: ["solid gold or platinum", "natural diamonds or other precious gemstones", "rings", "bracelets", "repairs of jewelry from other brands"],
};

const PRICING = {
  base: { earrings: 45, necklace: 60, pendant: 55 } as Record<string, number>,
  metalSurcharge: { "925 sterling silver": 0, "gold-plated sterling silver": 10, "gold-plated copper": 0 } as Record<string, number>,
  perStone: { "freshwater pearl": 6, "natural pearl": 10, moissanite: 25, "simulated diamond": 8, "clear cubic zirconia": 3 } as Record<string, number>,
  engraving: 15,
  complexity: { simple: 1, moderate: 1.4, intricate: 1.9 },
  leadTimeWeeks: { simple: 2, moderate: 3, intricate: 5 },
};

// ---------- Tools ----------

const SearchCatalog = z.object({
  keyword: z.string().optional().describe("Word to match in name, description or tags, e.g. 'pearl' or 'bridal'"),
  category: z.enum(["necklace", "earrings"]).optional(),
  maxPrice: z.number().optional(),
});

const EstimatePrice = z.object({
  pieceType: z.enum(["earrings", "necklace", "pendant"]),
  metal: z.string().describe("One of the workshop metals"),
  stones: z.array(z.object({ type: z.string(), count: z.number().int().min(0) })).describe("Stones from the workshop list"),
  engraving: z.boolean(),
  complexity: z.enum(["simple", "moderate", "intricate"]),
});

const SubmitTriage = z.object({
  requestType: z.enum(["custom-design", "modify-existing", "question", "spam-or-unclear"]),
  summary: z.string().describe("One sentence: what the customer wants"),
  feasibility: z.enum(["feasible", "needs-clarification", "not-feasible"]),
  feasibilityReason: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  priorityReason: z.string(),
  estimate: z
    .object({ low: z.number(), high: z.number(), leadTimeWeeks: z.number() })
    .nullable()
    .describe("From estimate_price, or null if not feasible or too unclear to price"),
  similarProductIds: z.array(z.string()).describe("Existing products to suggest as alternatives or references"),
  missingInfo: z.array(z.string()).describe("Questions to ask the customer before quoting"),
  draftReply: z.string().describe(`Email reply to the customer from ${BRAND_NAME}, warm and concise, plain text`),
});

export type Triage = z.infer<typeof SubmitTriage>;

function toolDef(name: string, description: string, schema: z.ZodType): Anthropic.Beta.BetaTool {
  const { $schema: _, ...inputSchema } = z.toJSONSchema(schema);
  return { name, description, input_schema: inputSchema as Anthropic.Beta.BetaTool.InputSchema };
}

const TOOLS: Anthropic.Beta.BetaTool[] = [
  toolDef("search_catalog", "Search the existing product catalog. Use to find similar pieces to suggest.", SearchCatalog),
  toolDef("get_workshop_capabilities", "What the workshop can and cannot make: metals, stones, piece types, engraving, chain lengths.", z.object({})),
  toolDef("estimate_price", "Price range and lead time for a custom piece. Only for metals and stones the workshop offers.", EstimatePrice),
  toolDef("submit_triage", "Submit the final triage. Call exactly once, as the last step.", SubmitTriage),
];

function searchCatalog(args: z.infer<typeof SearchCatalog>) {
  const kw = args.keyword?.toLowerCase();
  const found = products.filter(
    (p) =>
      (!args.category || p.category === args.category) &&
      (args.maxPrice === undefined || p.price <= args.maxPrice) &&
      (!kw || `${p.name} ${p.description} ${p.tags.join(" ")} ${p.metal} ${p.stone ?? ""}`.toLowerCase().includes(kw)),
  );
  return found.length
    ? found.map((p) => ({ id: p.id, name: p.name, category: p.category, metal: p.metal, stone: p.stone, price: formatPrice(p.price) }))
    : "No matching products.";
}

function estimatePrice(args: z.infer<typeof EstimatePrice>) {
  if (!(args.metal in PRICING.metalSurcharge)) return { error: `Metal not offered: ${args.metal}` };
  const badStone = args.stones.find((s) => !(s.type in PRICING.perStone));
  if (badStone) return { error: `Stone not offered: ${badStone.type}` };
  const materials =
    PRICING.base[args.pieceType] +
    PRICING.metalSurcharge[args.metal] +
    args.stones.reduce((sum, s) => sum + PRICING.perStone[s.type] * s.count, 0) +
    (args.engraving ? PRICING.engraving : 0);
  const mid = materials * PRICING.complexity[args.complexity];
  return { low: Math.round(mid * 0.9), high: Math.round(mid * 1.2), leadTimeWeeks: PRICING.leadTimeWeeks[args.complexity] };
}

function runTool(name: string, input: unknown): unknown {
  switch (name) {
    case "search_catalog":
      return searchCatalog(SearchCatalog.parse(input));
    case "get_workshop_capabilities":
      return WORKSHOP;
    case "estimate_price":
      return estimatePrice(EstimatePrice.parse(input));
    default:
      return { error: `Unknown tool ${name}` };
  }
}

// ---------- The agent loop ----------

export interface TraceStep {
  tool: string;
  input: unknown;
  output: unknown;
}

const SYSTEM = `You triage custom-design requests for ${BRAND_NAME}, an independent jewelry brand.
For each request:
1. Check what the workshop can make (get_workshop_capabilities).
2. If feasible, estimate the price (estimate_price). If key details are missing, estimate with reasonable assumptions and list the questions to ask.
3. Look for similar existing products (search_catalog) to suggest as references or cheaper alternatives.
4. Call submit_triage.

Priority: high if the customer mentions a date within 3 weeks, or the estimate is $150 or more; low for spam or very unclear requests; otherwise medium.
Be honest in the draft reply: never promise materials or services the workshop does not offer, and quote only the estimated range.
Today's date is ${new Date().toISOString().slice(0, 10)}.`;

const MAX_STEPS = 8;

export async function triageRequest(request: string): Promise<{ triage: Triage; trace: TraceStep[] }> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `New custom-design request:\n\n${request}` }];
  const trace: TraceStep[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      tools: TOOLS,
      // On the last step, force the final answer.
      tool_choice: step === MAX_STEPS - 1 ? { type: "tool", name: "submit_triage" } : { type: "auto" },
      messages,
    });
    if (response.stop_reason === "refusal") throw new RefusalError("The request was declined.");

    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    const final = toolUses.find((b) => b.name === "submit_triage");
    if (final) {
      const triage = SubmitTriage.parse(final.input);
      const known = new Set(products.map((p) => p.id));
      triage.similarProductIds = triage.similarProductIds.filter((id) => known.has(id));
      trace.push({ tool: "submit_triage", input: "(final answer below)", output: "done" });
      return { triage, trace };
    }
    if (toolUses.length === 0) {
      // Claude answered in text instead of using a tool: ask it to finish properly.
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: "Please call submit_triage with your assessment." });
      continue;
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((use) => {
      let output: unknown;
      let isError = false;
      try {
        output = runTool(use.name, use.input);
      } catch (e) {
        output = { error: (e as Error).message };
        isError = true;
      }
      trace.push({ tool: use.name, input: use.input, output });
      return { type: "tool_result", tool_use_id: use.id, content: JSON.stringify(output), is_error: isError };
    });
    messages.push({ role: "user", content: results });
  }
  throw new Error("The agent did not finish within the step limit.");
}
