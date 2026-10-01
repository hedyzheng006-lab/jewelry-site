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

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";

function briefText(b: Brief, idea: string, budget: string) {
  return [
    `Custom design request: ${b.title}`,
    "",
    `My idea: ${idea}`,
    `Budget: ${budget || "not given"}`,
    "",
    `Piece: ${b.pieceType}`,
    `Metal: ${b.metal}`,
    `Stones: ${b.stones}`,
    `Style: ${b.style}`,
    `Engraving: ${b.engraving}`,
    "Details:",
    ...b.details.map((d) => `- ${d}`),
  ].join("\n");
}

export default function Custom() {
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBrief(null);
    try {
      setBrief(await postJSON<Brief>("/api/custom", { idea, budget }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Custom Design</p>
      <h1>Describe the piece you imagine</h1>
      <p className="lead">We&apos;ll turn your idea into a concept sketch and a design brief you can send to our jeweler for a quote.</p>

      <form className="form" onSubmit={submit}>
        <label>Your idea
          <textarea
            required
            minLength={5}
            maxLength={2000}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. A thin gold ring with a tiny wave engraved around it and our wedding date inside, for my partner who surfs"
          />
        </label>
        <label>Budget (optional)
          <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. $400" maxLength={50} />
        </label>
        <button className="btn" disabled={loading}>{loading ? "Sketching…" : "Create my design"}</button>
      </form>

      {error && <p className="error">{error}</p>}

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
            <a
              className="btn"
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Custom design: ${brief.title}`)}&body=${encodeURIComponent(briefText(brief, idea, budget))}`}
            >
              Send this brief to our jeweler
            </a>
            <p className="muted small">The sketch is an AI concept to start the conversation. Your final piece is designed with our jeweler.</p>
          </div>
        </div>
      )}
    </div>
  );
}
