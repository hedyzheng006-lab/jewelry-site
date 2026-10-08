import { z } from "zod";
import { errorResponse, MissingKeyError } from "@/lib/claude";
import { triageRequest } from "@/lib/triage";

// The agent makes several Claude calls in a row.
export const maxDuration = 60;

const Input = z.object({ request: z.string().trim().min(5).max(3000) });

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please paste a request (at least a few words)." }, { status: 400 });

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new MissingKeyError("ANTHROPIC_API_KEY is not set");
    return Response.json(await triageRequest(parsed.data.request));
  } catch (error) {
    return errorResponse(error);
  }
}
