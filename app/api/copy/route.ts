import { z } from "zod";
import { askClaude, BRAND_NAME, errorResponse } from "@/lib/claude";

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const Input = z.object({
  image: z.string().max(4_200_000), // base64 of a 3 MB image
  mediaType: z.enum(MEDIA_TYPES),
  notes: z.string().max(1000).optional().default(""),
});

const Output = z.object({
  productName: z.string(),
  shortDescription: z.string().describe("One line for product cards, under 20 words"),
  longDescription: z.string().describe("2 short paragraphs for the product page"),
  seoTitle: z.string().describe("Under 60 characters"),
  metaDescription: z.string().describe("Under 155 characters"),
  altText: z.string().describe("Accessible image description"),
  tags: z.array(z.string()).describe("5-8 lowercase tags"),
  needsCheck: z.array(z.string()).describe("Facts you guessed from the photo that the owner should confirm, e.g. metal or stone"),
});

const SYSTEM = `You write product copy for ${BRAND_NAME}, an independent jewelry brand selling to English-speaking customers.
Look at the product photo and the owner's notes, then write warm, specific, honest copy.
Never state materials, sizes or certifications as fact unless the notes say so; describe what is visible and list your guesses in needsCheck.`;

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please upload a JPG, PNG, WebP or GIF under 3 MB." }, { status: 400 });
  const d = parsed.data;

  try {
    const result = await askClaude({
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: d.mediaType, data: d.image } },
            { type: "text", text: `Owner's notes: ${d.notes || "none"}` },
          ],
        },
      ],
      schema: Output,
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
