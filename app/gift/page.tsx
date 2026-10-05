"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";

export default function GiftCard() {
  const [form, setForm] = useState({ orderNumber: "", recipient: "", occasion: "", website: "" });
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
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
      setEditing(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const message = selected === null ? "" : ideas[selected];

  function edit(i: number, text: string) {
    setIdeas(ideas.map((m, j) => (j === i ? text : m)));
  }

  async function send() {
    setSending(true);
    setError("");
    try {
      await postJSON("/api/gift-card", { ...form, message });
      setSent(true);
      window.scrollTo(0, 0);
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
        <h1>Thank you</h1>
        <div className="notice">
          <h2>We&apos;ve received your card message.</h2>
          <p>It will be shipped together with your jewelry (order {form.orderNumber}).</p>
          <p className="gift-preview">{message}</p>
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
          <p className="muted small">Pick the one you like. Tap Edit to change any words.</p>
          <div className="cards-msg">
            {ideas.map((m, i) => (
              <div key={i} className={`gift-card${selected === i ? " selected" : ""}`}>
                {editing === i ? (
                  <textarea
                    className="gift-edit"
                    autoFocus
                    value={m}
                    maxLength={600}
                    onChange={(e) => edit(i, e.target.value)}
                  />
                ) : (
                  <p>{m}</p>
                )}
                <div className="gift-actions">
                  <button type="button" className="link-btn" onClick={() => setSelected(i)}>
                    {selected === i ? "Selected" : "Use this"}
                  </button>
                  <button type="button" className="link-btn" onClick={() => setEditing(editing === i ? null : i)}>
                    {editing === i ? "Done" : "Edit"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form">
            {message.trim() ? (
              <p className="muted small">Your card will read: <em>{message}</em></p>
            ) : (
              <p className="muted small">Choose a message above to continue.</p>
            )}
            <button type="button" className="btn" disabled={sending || !message.trim()} onClick={send}>
              {sending ? "Sending…" : "Customize my card"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
