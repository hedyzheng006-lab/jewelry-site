// Sends one row to the owner's Google Sheet through the Apps Script web app
// in docs/google-sheet-inquiries.gs. `type` picks the tab.
export class SheetNotConfiguredError extends Error {}

export async function appendToSheet(type: "custom-request" | "gift-card", fields: Record<string, string>) {
  // Trim: values pasted into Vercel often pick up a stray space or newline.
  const url = process.env.INQUIRY_WEBHOOK_URL?.trim();
  const secret = process.env.INQUIRY_WEBHOOK_SECRET?.trim();
  if (!url || !secret) throw new SheetNotConfiguredError("INQUIRY_WEBHOOK_URL or INQUIRY_WEBHOOK_SECRET is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, type, ...fields }),
  });
  const text = await res.text();
  let data: { ok?: boolean } | null = null;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok || !data?.ok) throw new Error(`Sheet webhook failed: ${res.status} ${text.slice(0, 500)}`);
}

export function sheetErrorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof SheetNotConfiguredError) {
    return Response.json({ error: "This form is not set up yet. Please try again later." }, { status: 500 });
  }
  return Response.json({ error: "We couldn't send your request. Please try again." }, { status: 502 });
}
