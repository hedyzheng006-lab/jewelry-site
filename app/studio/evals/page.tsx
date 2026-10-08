"use client";

import { useEffect, useState } from "react";
import { advisorCases, type EvalGroup } from "@/lib/evals/advisor-cases";
import { postJSON } from "@/lib/post";
import { getProduct } from "@/lib/products";

type Check = { name: string; pass: boolean; detail: string };
type Result = {
  caseId: string;
  output: { reply: string; productIds: string[] };
  checks: Check[];
  pass: boolean;
  latencyMs: number;
  error?: string;
};
type Run = { at: string; passed: number; total: number };

const CONCURRENCY = 3;
const HISTORY_KEY = "advisor-eval-history";

function loadHistory(): Run[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "–");

export default function Evals() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<Run[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => setHistory(loadHistory()), []);

  async function runAll() {
    setRunning(true);
    setResults({});
    const all: Record<string, Result> = {};
    const queue = [...advisorCases];
    async function worker() {
      for (let c = queue.shift(); c; c = queue.shift()) {
        let r: Result;
        try {
          r = await postJSON<Result>("/api/evals/advisor", { caseId: c.id });
        } catch (e) {
          r = { caseId: c.id, output: { reply: "", productIds: [] }, checks: [], pass: false, latencyMs: 0, error: (e as Error).message };
        }
        all[c.id] = r;
        setResults((prev) => ({ ...prev, [c.id]: r }));
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const passed = Object.values(all).filter((r) => r.pass).length;
    const next = [{ at: new Date().toLocaleString(), passed, total: advisorCases.length }, ...loadHistory()].slice(0, 10);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {}
    setHistory(next);
    setRunning(false);
  }

  function download() {
    const blob = new Blob([JSON.stringify({ runAt: new Date().toISOString(), results: Object.values(results) }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "advisor-eval-results.json";
    a.click();
  }

  const done = Object.values(results);
  const passed = done.filter((r) => r.pass).length;
  const groups = [...new Set(advisorCases.map((c) => c.group))] as EvalGroup[];
  const checkStats = new Map<string, { pass: number; total: number }>();
  for (const r of done) {
    for (const c of r.checks) {
      const key = c.name.startsWith("judge:") ? "LLM judge" : c.name.replace(/^only .*/, "right category").replace(/^metal .*/, "right metal").replace(/^tagged .*/, "fits occasion tag");
      const s = checkStats.get(key) ?? { pass: 0, total: 0 };
      s.total++;
      if (c.pass) s.pass++;
      checkStats.set(key, s);
    }
  }
  const latencies = done.filter((r) => r.latencyMs).map((r) => r.latencyMs).sort((a, b) => a - b);
  const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0;

  return (
    <div className="page">
      <p className="eyebrow">Studio tools · for the shop owner</p>
      <h1>AI Advisor evals</h1>
      <p className="lead">
        Runs {advisorCases.length} test conversations through the AI Advisor and grades each answer: code checks for budget,
        category and invented products, and an LLM judge for honesty, tone and follow-up questions.
      </p>

      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <button className="btn" onClick={runAll} disabled={running}>
          {running ? `Running… ${done.length}/${advisorCases.length}` : "Run all tests"}
        </button>
        {done.length > 0 && !running && <button className="btn btn-outline" onClick={download}>Download results (JSON)</button>}
      </div>

      {done.length > 0 && (
        <div className="eval-summary">
          <div className="stat"><span>{pct(passed, done.length)}</span>cases passed ({passed}/{done.length})</div>
          <div className="stat"><span>{(median / 1000).toFixed(1)}s</span>median answer time</div>
          {groups.map((g) => {
            const rs = advisorCases.filter((c) => c.group === g).map((c) => results[c.id]).filter(Boolean);
            return <div key={g} className="stat"><span>{pct(rs.filter((r) => r.pass).length, rs.length)}</span>{g}</div>;
          })}
        </div>
      )}

      {checkStats.size > 0 && (
        <>
          <h3>Pass rate by check</h3>
          <table className="eval-table">
            <tbody>
              {[...checkStats].map(([name, s]) => (
                <tr key={name}><td>{name}</td><td>{pct(s.pass, s.total)}</td><td className="muted">{s.pass}/{s.total}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Test cases</h3>
      <table className="eval-table">
        <thead>
          <tr><th>Result</th><th>Case</th><th>Group</th><th>Shopper said</th></tr>
        </thead>
        <tbody>
          {advisorCases.map((c) => {
            const r = results[c.id];
            return [
              <tr key={c.id} onClick={() => r && setOpen(open === c.id ? null : c.id)} className={r ? "clickable" : ""}>
                <td>{!r ? (running ? "…" : "–") : r.pass ? <span className="ok">PASS</span> : <span className="error">FAIL</span>}</td>
                <td>{c.id}</td>
                <td className="muted">{c.group}</td>
                <td>{c.messages.at(-1)?.content}</td>
              </tr>,
              open === c.id && r && (
                <tr key={c.id + "-detail"}>
                  <td colSpan={4} className="eval-detail">
                    {r.error ? <p className="error">{r.error}</p> : (
                      <>
                        <p><strong>Reply:</strong> {r.output.reply}</p>
                        <p><strong>Products:</strong> {r.output.productIds.map((id) => getProduct(id)?.name ?? `${id} (unknown!)`).join(", ") || "none"}</p>
                        <ul>
                          {r.checks.map((k, i) => (
                            <li key={i}><span className={k.pass ? "ok" : "error"}>{k.pass ? "✓" : "✗"}</span> {k.name}: <span className="muted">{k.detail}</span></li>
                          ))}
                        </ul>
                      </>
                    )}
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>

      {history.length > 0 && (
        <>
          <h3>Previous runs (this browser)</h3>
          <ul className="muted small">
            {history.map((h, i) => <li key={i}>{h.at}: {h.passed}/{h.total} passed ({pct(h.passed, h.total)})</li>)}
          </ul>
        </>
      )}
    </div>
  );
}
