"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { postJSON } from "@/lib/post";
import { getProduct } from "@/lib/products";

type Turn = { role: "user" | "assistant"; content: string; productIds?: string[] };

const starters = [
  "A minimalist ring I can wear every day, under $200",
  "Earrings for a black-tie wedding",
  "Something for my mom's 60th birthday, she loves pink",
];

export default function Advisor() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Turn[] = [...turns, { role: "user", content: text.trim() }];
    setTurns(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const res = await postJSON<{ reply: string; productIds: string[] }>("/api/advisor", {
        messages: next.map(({ role, content }) => ({ role, content })),
      });
      setTurns([...next, { role: "assistant", content: res.reply, productIds: res.productIds }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">AI Jewelry Advisor</p>
      <h1>What are you looking for?</h1>
      <p className="lead">Describe the occasion, your budget and your style. The advisor only recommends pieces from our collection.</p>

      <div className="chat">
        {turns.length === 0 && (
          <div className="chips">
            {starters.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}`}>
            <p>{t.content}</p>
            {t.productIds && t.productIds.length > 0 && (
              <div className="grid small">
                {t.productIds.map((id) => {
                  const p = getProduct(id);
                  return p ? <ProductCard key={id} product={p} /> : null;
                })}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="bubble assistant muted">Thinking…</div>}
        {error && <p className="error">{error}</p>}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. A gift for my sister who loves gold, around $150"
          maxLength={2000}
        />
        <button className="btn" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
