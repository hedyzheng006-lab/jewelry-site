"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";

export default function GiftCard() {
  const [form, setForm] = useState({ orderNumber: "", recipient: "", occasion: "", website: "" });
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { messages } = await postJSON<{ messages: string[] }>("/api/gift", {
        recipient: form.recipient,
        occasion: form.occasion,
      });
      setIdeas(messages);
      setSelected(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function choose(i: number) {
    setSelected(i);
    setMessage(ideas[i]);
  }

  async function send() {
    setSending(true);
    setError("");
    try {
      await postJSON("/api/gift-card", { ...form, message });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="page narrow">
        <p className="eyebrow">Gift Card</p>
        <h1>Your card is on its way</h1>
        <div className="notice">
          <h2>Thank you, we&apos;ve saved your card for order {form.orderNumber}.</h2>
          <p className="gift-preview">{message}</p>
          <p className="muted">We&apos;ll include it with your jewelry, free of charge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Gift Card</p>
      <h1>Add a free card to your gift</h1>
      <p className="lead">Bought a piece as a gift? Enter your order number and we&apos;ll include a card with your message, free.</p>

      <form className="form" onSubmit={generate}>
        <label>Jewelry order number *
          <input required value={form.orderNumber} onChange={set("orderNumber")} placeholder="e.g. HY-1024" maxLength={60} />
        </label>
        <label>Who is it for?
          <input value={form.recipient} onChange={set("recipient")} placeholder="e.g. my wife, best friend, mom" maxLength={100} />
        </label>
        <label>Occasion
          <input value={form.occasion} onChange={set("occasion")} placeholder="e.g. 10th anniversary, birthday, graduation" maxLength={100} />
        </label>
        <label className="hp" aria-hidden="true">Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
        <button className="btn" disabled={loading}>
          {loading ? "Writing ideas…" : ideas.length ? "Get new ideas" : "Get card message ideas"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {ideas.length > 0 && (
        <div className="result">
          <h2>Card message ideas</h2>
          <p className="muted small">Pick one to use it, or copy it and make it your own below.</p>
          <div className="cards-msg">
            {ideas.map((m, i) => (
              <div key={i} className={`gift-card${selected === i ? " selected" : ""}`}>
                <p>{m}</p>
                <div className="gift-actions">
                  <button type="button" className="link-btn" onClick={() => choose(i)}>
                    {selected === i ? "Selected" : "Use this"}
                  </button>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(m);
                      setCopied(i);
                    }}
                  >
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form">
            <label>Your card message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={600}
                placeholder="Choose an idea above, paste one, or write your own."
              />
            </label>
            <button type="button" className="btn" disabled={sending || !message.trim()} onClick={send}>
              {sending ? "Sending…" : "Send my card"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
