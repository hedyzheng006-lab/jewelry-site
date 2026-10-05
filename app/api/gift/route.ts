import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";

const Input = z.object({
  recipient: z.string().trim().max(100).optional().default(""),
  occasion: z.string().trim().max(100).optional().default(""),
});

const Output = z.object({
  messages: z
    .array(z.string())
    .describe(
      "8 gift card messages, each under 40 words, in varied tones: heartfelt, romantic or loving, playful, short and simple, poetic, grateful, celebratory, and one that mentions the jewelry",
    ),
});

const SYSTEM = `You write gift card messages for ${BRAND_NAME}, an independent jewelry brand.
A customer has bought a piece of jewelry as a gift and wants a message for the free card that comes with it.
Write warm, natural messages in English that fit the recipient and occasion.
Each message is under 40 words. Never use placeholder names or brackets like [Name]; write messages that work without a name.`;

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const d = parsed.data;

  const prompt = `Recipient: ${d.recipient || "not given"}
Occasion: ${d.occasion || "not given"}`;

  try {
    const result = await askClaude({
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      schema: Output,
    });
    return Response.json({ messages: result.messages.slice(0, 8) });
  } catch (error) {
    return errorResponse(error);
  }
}
