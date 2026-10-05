import { z } from "zod";
import { appendToSheet, sheetErrorResponse } from "@/lib/sheet";

const Input = z.object({
  orderNumber: z.string().trim().min(1).max(60),
  recipient: z.string().trim().max(100).optional().default(""),
  occasion: z.string().trim().max(100).optional().default(""),
  message: z.string().trim().min(1).max(600),
  // Honeypot: hidden from people, bots tend to fill it in.
  website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please enter your order number and a card message." }, { status: 400 });
  }
  const { website, ...fields } = parsed.data;
  if (website) return Response.json({ ok: true });

  try {
    await appendToSheet("gift-card", fields);
    return Response.json({ ok: true });
  } catch (error) {
    return sheetErrorResponse(error);
  }
}
