import { z } from "zod";
import { runAdvisor } from "@/lib/advisor";
import { errorResponse } from "@/lib/claude";
import { advisorCases } from "@/lib/evals/advisor-cases";
import { codeChecks, judge } from "@/lib/evals/grade";

// Runs one test case from the fixed set (never free text) and grades it.
const Input = z.object({ caseId: z.string() });

export async function POST(req: Request) {
  const parsed = Input.safeParse(await req.json().catch(() => null));
  const testCase = advisorCases.find((c) => c.id === parsed.data?.caseId);
  if (!testCase) return Response.json({ error: "Unknown test case" }, { status: 400 });

  try {
    const started = Date.now();
    const output = await runAdvisor(testCase.messages);
    const latencyMs = Date.now() - started;
    const checks = codeChecks(testCase, output);
    const verdict = await judge(testCase, output);
    if (verdict) checks.push(verdict);
    return Response.json({ caseId: testCase.id, output, checks, pass: checks.every((c) => c.pass), latencyMs });
  } catch (error) {
    return errorResponse(error);
  }
}
