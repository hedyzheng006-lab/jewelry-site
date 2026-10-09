"use client";

import { useState } from "react";

// A small MCP client in the browser: sends the same JSON-RPC messages an AI app
// (Claude, Claude Code, Copilot…) would send to /api/mcp, and shows the replies.

type Step = { label: string; explain: string; body: object; auth: boolean };

const steps: Step[] = [
  {
    label: "1. Connect (initialize)",
    explain: "The AI app says hello and agrees on a protocol version. The server answers with its name and what it can do.",
    body: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "studio-test-page", version: "1.0" } } },
    auth: true,
  },
  {
    label: "2. List tools",
    explain: "The AI app asks which tools exist. Each tool comes with a description and a parameter schema, which is how the AI knows when and how to call it.",
    body: { jsonrpc: "2.0", id: 2, method: "tools/list" },
    auth: true,
  },
  {
    label: "3. Call search_products",
    explain: 'What happens when a user asks the AI "Which earrings are under $30?": the AI calls the tool with these arguments and gets live catalog data back.',
    body: { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_products", arguments: { category: "earrings", maxPrice: 30 } } },
    auth: true,
  },
  {
    label: "4. Call get_product",
    explain: "The AI asks for full details of one product.",
    body: { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_product", arguments: { id: "pearl-halo-necklace" } } },
    auth: true,
  },
  {
    label: "5. Try without the key",
    explain: "Same request with no key: the server refuses it with 401 Unauthorized. This is the authentication check.",
    body: { jsonrpc: "2.0", id: 5, method: "tools/list" },
    auth: false,
  },
];

export default function McpTest() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<{ step: Step; status: number; request: string; response: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(step: Step) {
    setLoading(true);
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
    if (step.auth) headers.Authorization = `Bearer ${key.trim()}`;
    try {
      const res = await fetch("/api/mcp", { method: "POST", headers, body: JSON.stringify(step.body) });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      const shownHeaders = step.auth ? "Authorization: Bearer ••••••\n" : "(no Authorization header)\n";
      setResult({ step, status: res.status, request: `POST /api/mcp\n${shownHeaders}\n${JSON.stringify(step.body, null, 2)}`, response: pretty || "(empty)" });
    } catch (e) {
      setResult({ step, status: 0, request: "", response: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Studio tools · for the shop owner</p>
      <h1>MCP server test</h1>
      <p className="lead">
        This page acts like an AI app connecting to the catalog MCP server at <code>/api/mcp</code>. Click the steps in
        order to see each request and the server&apos;s reply.
      </p>

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <label>
          MCP key (the MCP_API_KEY value set in Vercel)
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
        </label>
      </form>

      <div className="chips">
        {steps.map((s) => (
          <button key={s.label} className="chip" onClick={() => run(s)} disabled={loading || (s.auth && !key.trim())}>
            {s.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="result">
          <h3>{result.step.label}</h3>
          <p className="muted">{result.step.explain}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={result.status >= 200 && result.status < 300 ? "ok" : "error"}>{result.status || "network error"}</span>
            {result.status === 503 && " (MCP_API_KEY is not set in Vercel yet, so the server is closed)"}
            {result.status === 401 && result.step.auth && " (the key does not match MCP_API_KEY in Vercel)"}
          </p>
          <div className="mcp-io">
            <div>
              <p className="small muted">Request sent</p>
              <pre className="small">{result.request}</pre>
            </div>
            <div>
              <p className="small muted">Response</p>
              <pre className="small">{result.response}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
