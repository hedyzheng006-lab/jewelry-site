import { z } from "zod";
import { runAdvisor } from "@/lib/advisor";
import { errorResponse } from "@/lib/claude";
import { products } from "@/lib/products";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  try {
    const result = await runAdvisor(parsed.data.messages);
    const known = new Set(products.map((p) => p.id));
    return Response.json({
      reply: result.reply,
      productIds: result.productIds.filter((id) => known.has(id)).slice(0, 3),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
