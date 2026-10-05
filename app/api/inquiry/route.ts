import { z } from "zod";

// Custom design requests are appended to the owner's Google Sheet through a
// Google Apps Script web app (see docs/google-sheet-inquiries.gs).
const Input = z.object({
  idea: z.string().trim().min(5).max(2000),
  budget: z.string().trim().max(50).optional().default(""),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  // Honeypot: hidden from people, bots tend to fill it in.
  website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please describe your idea and enter a valid email." }, { status: 400 });
  }
  const { website, ...fields } = parsed.data;
  if (website) return Response.json({ ok: true });

  const url = process.env.INQUIRY_WEBHOOK_URL;
  const secret = process.env.INQUIRY_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error("INQUIRY_WEBHOOK_URL or INQUIRY_WEBHOOK_SECRET is not set");
    return Response.json({ error: "The request form is not set up yet. Please try again later." }, { status: 500 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, ...fields }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error(`Sheet webhook failed: ${res.status} ${JSON.stringify(data)}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "We couldn't send your request. Please try again." }, { status: 502 });
  }
}
