// Sends one row to the owner's Google Sheet through the Apps Script web app
// in docs/google-sheet-inquiries.gs. `type` picks the tab.
export class SheetNotConfiguredError extends Error {}

export async function appendToSheet(type: "custom-request" | "gift-card", fields: Record<string, string>) {
  const url = process.env.INQUIRY_WEBHOOK_URL;
  const secret = process.env.INQUIRY_WEBHOOK_SECRET;
  if (!url || !secret) throw new SheetNotConfiguredError("INQUIRY_WEBHOOK_URL or INQUIRY_WEBHOOK_SECRET is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, type, ...fields }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(`Sheet webhook failed: ${res.status} ${JSON.stringify(data)}`);
}

export function sheetErrorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof SheetNotConfiguredError) {
    return Response.json({ error: "This form is not set up yet. Please try again later." }, { status: 500 });
  }
  return Response.json({ error: "We couldn't send your request. Please try again." }, { status: 502 });
}
