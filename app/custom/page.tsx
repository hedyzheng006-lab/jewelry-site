"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";

type Brief = {
  title: string;
  pieceType: string;
  metal: string;
  stones: string;
  style: string;
  details: string[];
  engraving: string;
  budgetFit: string;
  openQuestions: string[];
  svg: string;
};

export default function Custom() {
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [sketching, setSketching] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await postJSON("/api/inquiry", { idea, budget, email, phone, website });
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
      return;
    }
    setSending(false);
    setSent(true);

    // The request is saved; the AI concept sketch is a bonus and may fail quietly.
    setSketching(true);
    try {
      setBrief(await postJSON<Brief>("/api/custom", { idea, budget }));
    } catch {
      // ignore
    } finally {
      setSketching(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Custom Design</p>
      <h1>Describe the piece you imagine</h1>
      <p className="lead">Tell us about your idea and we&apos;ll get back to you by email with design options and a quote.</p>

      {sent ? (
        <div className="notice">
          <h2>Thank you, we&apos;ve received your request.</h2>
          <p>We&apos;ll reply to {email} soon.</p>
          {sketching && <p className="muted">Sketching an AI concept of your idea…</p>}
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <label>Your idea *
            <textarea
              required
              minLength={5}
              maxLength={2000}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A dainty gold necklace with a small wave pendant and our wedding date engraved on the back, for my partner who surfs"
            />
          </label>
          <label>Budget (optional)
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. $400" maxLength={50} />
          </label>
          <label>Email *
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={200} autoComplete="email" />
          </label>
          <label>Phone (optional)
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" maxLength={40} autoComplete="tel" />
          </label>
          <label className="hp" aria-hidden="true">Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
          <button className="btn" disabled={sending}>{sending ? "Sending…" : "Send my request"}</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {brief && (
        <div className="result design">
          {brief.svg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="sketch"
              alt={`Concept sketch: ${brief.title}`}
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(brief.svg)}`}
            />
          )}
          <div>
            <h2>{brief.title}</h2>
            <ul className="specs">
              <li>Piece: {brief.pieceType}</li>
              <li>Metal: {brief.metal}</li>
              <li>Stones: {brief.stones}</li>
              <li>Style: {brief.style}</li>
              <li>Engraving: {brief.engraving}</li>
            </ul>
            <h3>Design details</h3>
            <ul>{brief.details.map((d) => <li key={d}>{d}</li>)}</ul>
            <h3>Budget</h3>
            <p>{brief.budgetFit}</p>
            <h3>Our jeweler may ask</h3>
            <ul>{brief.openQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
            <p className="muted small">This sketch is an AI concept to start the conversation. Your final piece is designed with our jeweler, who will follow up by email.</p>
          </div>
        </div>
      )}
    </div>
  );
}
