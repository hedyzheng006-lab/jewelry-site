import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";

const Input = z.object({
  idea: z.string().min(5).max(2000),
  budget: z.string().max(50).optional().default(""),
});

const Output = z.object({
  title: z.string().describe("A short evocative name for the design"),
  pieceType: z.string().describe("ring, necklace, earrings, bracelet, or other"),
  metal: z.string(),
  stones: z.string().describe("Stones and cuts, or 'none'"),
  style: z.string().describe("Design style in a few words"),
  details: z.array(z.string()).describe("3-6 concrete design details a jeweler can act on"),
  engraving: z.string().describe("Engraving or personalization, or 'none'"),
  budgetFit: z.string().describe("Honest note on whether the idea fits the budget and what could change"),
  openQuestions: z.array(z.string()).describe("1-3 questions the jeweler should ask before quoting"),
  svg: z
    .string()
    .describe(
      "A simple concept sketch as a standalone SVG: viewBox='0 0 400 400', soft cream background, clean line-art of the piece with flat fills for metal and stones. No text, no scripts, no external references.",
    ),
});

const SYSTEM = `You are the custom design assistant for ${BRAND_NAME}, an independent jewelry studio.
A customer describes an idea for a custom piece. Turn it into a clear design brief the jeweler can quote from, plus a simple concept sketch.
Be realistic about what can be made. Keep the sketch simple and elegant.`;

// The SVG is shown in an <img>, which never runs scripts; this strip is a second guard.
function cleanSvg(svg: string): string {
  const start = svg.indexOf("<svg");
  const end = svg.lastIndexOf("</svg>");
  if (start === -1 || end === -1) return "";
  return svg
    .slice(start, end + 6)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please describe your idea in a few words." }, { status: 400 });

  const prompt = `Idea: ${parsed.data.idea}\nBudget: ${parsed.data.budget || "not given"}`;
  try {
    const result = await askClaude({
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      schema: Output,
      effort: "medium",
    });
    return Response.json({ ...result, svg: cleanSvg(result.svg) });
  } catch (error) {
    return errorResponse(error);
  }
}
