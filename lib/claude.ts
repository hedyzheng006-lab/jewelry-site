import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = "claude-opus-5-5";

const client = new Anthropic();

export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Aurelia";

export class RefusalError extends Error {}
export class MissingKeyError extends Error {}

/**
 * One structured call to Claude. Returns the parsed object matching `schema`.
 * `fallbacks: "default"` lets the API retry a safety decline on another model.
 */
export async function askClaude<T extends z.ZodType>(opts: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: T;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<T>> {
  if (!process.env.ANTHROPIC_API_KEY) throw new MissingKeyError("ANTHROPIC_API_KEY is not set");

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: opts.effort ?? "low",
      format: betaZodOutputFormat(opts.schema),
    },
    system: opts.system,
    messages: opts.messages,
  });

  if (response.stop_reason === "refusal") {
    throw new RefusalError("The request was declined.");
  }
  if (response.parsed_output == null) {
    throw new Error(`No structured output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output as z.infer<T>;
}

/** Turns any error into a JSON response the pages can show. */
export function errorResponse(error: unknown): Response {
  console.error(error);
  if (error instanceof RefusalError) {
    return Response.json({ error: "Sorry, I can't help with that request." }, { status: 400 });
  }
  if (error instanceof MissingKeyError || error instanceof Anthropic.AuthenticationError) {
    return Response.json({ error: "The AI service is not configured yet (missing API key)." }, { status: 500 });
  }
  if (error instanceof Anthropic.RateLimitError) {
    return Response.json({ error: "Too many requests right now. Please try again in a minute." }, { status: 429 });
  }
  if (error instanceof Anthropic.APIError) {
    return Response.json({ error: "The AI service had a problem. Please try again." }, { status: 502 });
  }
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
