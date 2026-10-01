"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { postJSON } from "@/lib/post";
import { getProduct } from "@/lib/products";

type Result = {
  summary: string;
  picks: { productId: string; reason: string }[];
  cardMessages: string[];
};

export default function Gift() {
  const [form, setForm] = useState({ relationship: "", occasion: "", budget: "", style: "", notes: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await postJSON<Result>("/api/gift", form));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Gift Finder</p>
      <h1>Find a gift they&apos;ll keep forever</h1>
      <p className="lead">Tell us a little about them. We&apos;ll suggest pieces and write a card message for you.</p>

      <form className="form" onSubmit={submit}>
        <label>Who is it for?
          <input required value={form.relationship} onChange={set("relationship")} placeholder="e.g. wife, best friend, mom" maxLength={100} />
        </label>
        <label>Occasion
          <input required value={form.occasion} onChange={set("occasion")} placeholder="e.g. 10th anniversary, graduation" maxLength={100} />
        </label>
        <label>Budget
          <select required value={form.budget} onChange={set("budget")}>
            <option value="">Choose…</option>
            <option>Under $100</option>
            <option>$100 to $250</option>
            <option>$250 to $500</option>
            <option>Over $500</option>
          </select>
        </label>
        <label>Their style
          <input required value={form.style} onChange={set("style")} placeholder="e.g. minimal, wears mostly silver, loves the ocean" maxLength={300} />
        </label>
        <label>Anything else? (optional)
          <textarea value={form.notes} onChange={set("notes")} placeholder="Birth month, hobbies, a shared memory…" maxLength={1000} />
        </label>
        <button className="btn" disabled={loading}>{loading ? "Finding ideas…" : "Find gift ideas"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <p className="summary">{result.summary}</p>
          <div className="grid">
            {result.picks.map((pick) => {
              const p = getProduct(pick.productId);
              return p ? <ProductCard key={p.id} product={p} note={pick.reason} /> : null;
            })}
          </div>
          <h2>Card message ideas</h2>
          <div className="cards-msg">
            {result.cardMessages.map((m, i) => (
              <div key={i} className="gift-card">
                <p>{m}</p>
                <button
                  className="link-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(m);
                    setCopied(i);
                  }}
                >
                  {copied === i ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
