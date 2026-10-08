"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";
import { getProduct } from "@/lib/products";
import type { Triage, TraceStep } from "@/lib/triage";

const samples = [
  "Hi! I'm getting married on the 25th of this month and would love matching pearl earrings for my 4 bridesmaids, gold tone, around $40 each. Is that possible? - Emma",
  "Could you make a silver bar necklace engraved with my mom's name, Margaret, for her 60th birthday in December? Budget about $90.",
  "I want a platinum ring with a 1 carat natural diamond for my proposal.",
  "something pretty",
];

const STEP_LABELS: Record<string, string> = {
  get_workshop_capabilities: "Checked what the workshop can make",
  search_catalog: "Searched the catalog",
  estimate_price: "Estimated the price",
  submit_triage: "Submitted the triage",
};

export default function TriagePage() {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ triage: Triage; trace: TraceStep[] } | null>(null);
  const [copied, setCopied] = useState(false);

  async function run(text: string) {
    setRequest(text);
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    try {
      setResult(await postJSON("/api/triage", { request: text }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const t = result?.triage;
  return (
    <div className="page narrow">
      <p className="eyebrow">Studio tools · for the shop owner</p>
      <h1>Custom request triage</h1>
      <p className="lead">
        Paste a customer&apos;s custom-design request. An AI agent checks what the workshop can make, estimates a price,
        finds similar pieces and drafts a reply. Nothing is sent: you review the draft first.
      </p>

      <div className="chips">
        {samples.map((s, i) => (
          <button key={i} className="chip" onClick={() => run(s)} disabled={loading}>Sample {i + 1}</button>
        ))}
      </div>

      <form className="form" onSubmit={(e) => { e.preventDefault(); run(request); }}>
        <label>
          Customer request
          <textarea value={request} onChange={(e) => setRequest(e.target.value)} maxLength={3000} placeholder="Paste the request from the email or Google Sheet" />
        </label>
        <button className="btn" disabled={loading || request.trim().length < 5}>{loading ? "Agent working…" : "Triage request"}</button>
      </form>
      {error && <p className="error">{error}</p>}

      {result && t && (
        <div className="result">
          <h2>Agent steps</h2>
          <ol className="trace">
            {result.trace.map((s, i) => (
              <li key={i}>
                <strong>{STEP_LABELS[s.tool] ?? s.tool}</strong> <code className="muted small">{s.tool}</code>
                {s.tool !== "submit_triage" && (
                  <details>
                    <summary className="small muted">Input and result</summary>
                    <pre className="small">{JSON.stringify(s.input, null, 2)}</pre>
                    <pre className="small">{JSON.stringify(s.output, null, 2)}</pre>
                  </details>
                )}
              </li>
            ))}
          </ol>

          <h2>Triage</h2>
          <p className="summary">{t.summary}</p>
          <div className="eval-summary">
            <div className="stat"><span className={t.feasibility === "not-feasible" ? "error" : t.feasibility === "feasible" ? "ok" : ""}>{t.feasibility.replace("-", " ")}</span>feasibility</div>
            <div className="stat"><span>{t.priority}</span>priority</div>
            <div className="stat"><span>{t.estimate ? `$${t.estimate.low}–${t.estimate.high}` : "–"}</span>estimate</div>
            <div className="stat"><span>{t.estimate ? `${t.estimate.leadTimeWeeks} wk` : "–"}</span>lead time</div>
          </div>
          <p><strong>Why this feasibility:</strong> {t.feasibilityReason}</p>
          <p><strong>Why this priority:</strong> {t.priorityReason}</p>
          {t.missingInfo.length > 0 && (
            <>
              <p><strong>Ask the customer:</strong></p>
              <ul>{t.missingInfo.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </>
          )}
          {t.similarProductIds.length > 0 && (
            <p><strong>Similar pieces:</strong> {t.similarProductIds.map((id) => getProduct(id)?.name).join(", ")}</p>
          )}

          <h3>Draft reply</h3>
          <div className="gift-card">
            <p style={{ whiteSpace: "pre-wrap", fontStyle: "normal", fontFamily: "var(--sans)", fontSize: "1rem" }}>{t.draftReply}</p>
            <button className="link-btn" onClick={() => { navigator.clipboard.writeText(t.draftReply); setCopied(true); }}>{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
