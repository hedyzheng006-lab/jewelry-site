// Graders for one advisor eval case.
// Code checks are exact and free. The LLM judge handles what code cannot check (honesty, tone, follow-up questions).
import { z } from "zod";
import type { AdvisorResult } from "@/lib/advisor";
import { askClaude } from "@/lib/claude";
import type { AdvisorCase } from "@/lib/evals/advisor-cases";
import { formatPrice, getProduct } from "@/lib/products";

export interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

export function codeChecks(c: AdvisorCase, out: AdvisorResult): CheckResult[] {
  const ids = out.productIds;
  const picked = ids.map(getProduct).filter((p) => p !== undefined);
  const names = picked.map((p) => `${p.name} (${formatPrice(p.price)})`).join(", ") || "none";
  const checks: CheckResult[] = [];

  // Always: no invented products, at most 3.
  const unknown = ids.filter((id) => !getProduct(id));
  checks.push({ name: "no invented products", pass: unknown.length === 0, detail: unknown.length ? `unknown ids: ${unknown.join(", ")}` : "all ids exist" });
  checks.push({ name: "at most 3 products", pass: ids.length <= 3, detail: `${ids.length} recommended` });

  const { maxPrice, category, metals, tag, noProducts, someProducts } = c.expect;
  if (maxPrice !== undefined) {
    const over = picked.filter((p) => p.price > maxPrice);
    checks.push({ name: "within budget", pass: over.length === 0, detail: over.length ? `over $${maxPrice}: ${over.map((p) => p.name).join(", ")}` : names });
  }
  if (category) {
    const wrong = picked.filter((p) => p.category !== category);
    checks.push({ name: `only ${category}`, pass: wrong.length === 0, detail: wrong.length ? `wrong: ${wrong.map((p) => p.name).join(", ")}` : names });
  }
  if (metals) {
    const wrong = picked.filter((p) => !metals.includes(p.metal));
    checks.push({ name: `metal ${metals.join("/")}`, pass: wrong.length === 0, detail: wrong.length ? `wrong: ${wrong.map((p) => `${p.name} (${p.metal})`).join(", ")}` : names });
  }
  if (tag) {
    const wrong = picked.filter((p) => !p.tags.includes(tag));
    checks.push({ name: `tagged ${tag}`, pass: wrong.length === 0, detail: wrong.length ? `missing tag: ${wrong.map((p) => p.name).join(", ")}` : names });
  }
  if (noProducts) checks.push({ name: "no products", pass: ids.length === 0, detail: names });
  if (someProducts) checks.push({ name: "recommends something", pass: ids.length > 0, detail: names });
  return checks;
}

const Verdict = z.object({
  pass: z.boolean().describe("true only if the reply fully meets the requirement"),
  reason: z.string().describe("One sentence explaining the verdict"),
});

/** LLM-as-judge: a second Claude call grades the reply against the case's rubric. */
export async function judge(c: AdvisorCase, out: AdvisorResult): Promise<CheckResult | null> {
  if (!c.expect.rubric) return null;
  const conversation = c.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const picked = out.productIds.map(getProduct).filter((p) => p !== undefined);
  const verdict = await askClaude({
    system: "You grade a jewelry shop's AI advisor. Be strict: pass only if the requirement is fully met. Prices listed for the recommended products are the true prices.",
    messages: [
      {
        role: "user",
        content: `Conversation:\n${conversation}\n\nAdvisor reply:\n${out.reply}\n\nRecommended products: ${picked.map((p) => `${p.name} ${formatPrice(p.price)} (${p.category}, ${p.metal})`).join("; ") || "none"}\n\nRequirement:\n${c.expect.rubric}`,
      },
    ],
    schema: Verdict,
  });
  return { name: "judge: " + c.expect.rubric, pass: verdict.pass, detail: verdict.reason };
}
