import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";
import { retrieve } from "@/lib/retrieval";

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

const Output = z.object({
  answer: z.string().describe("Answer to the customer, 1-4 sentences, plain text, no markdown"),
  sourceIds: z.array(z.string()).describe("Ids of the knowledge entries the answer is based on"),
  answered: z.boolean().describe("true if the knowledge entries contain the answer, false if not"),
});

function systemPrompt(context: string) {
  return `You are the customer-service assistant for ${BRAND_NAME}, an independent jewelry brand.
Answer questions about shipping, returns, orders, materials, care and products.

Rules:
- Answer ONLY with facts from the knowledge entries below. Never guess policies, dates, prices or materials.
- If the entries do not contain the answer, set answered to false, say you are not sure, and suggest emailing ${contact}.
- List in sourceIds every entry id you used, and no others.
- For order-specific requests (where is my order, change my address) explain the steps from the entries; you cannot look up orders.
- Product recommendations: point the customer to the AI Advisor page.
- Questions unrelated to the shop: politely steer back.

Knowledge entries:
${context}`;
}

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { messages } = parsed.data;
  if (messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  try {
    // Search with the last two customer messages so follow-ups ("and for pearls?") keep their context.
    const query = messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n");
    const { method, chunks } = await retrieve(query, 5);
    const context = chunks.map((c) => `[${c.id}] ${c.title}: ${c.text}`).join("\n");

    const result = await askClaude({ system: systemPrompt(context), messages, schema: Output });

    const retrieved = new Set(chunks.map((c) => c.id));
    const used = new Set(result.sourceIds.filter((id) => retrieved.has(id)));
    return Response.json({
      answer: result.answer,
      answered: result.answered,
      retrieval: method,
      sources: chunks.map((c) => ({ id: c.id, title: c.title, score: c.score, used: used.has(c.id) })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
