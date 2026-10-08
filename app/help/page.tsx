"use client";

import { useState } from "react";
import { postJSON } from "@/lib/post";

type Source = { id: string; title: string; score: number; used: boolean };
type Reply = { answer: string; answered: boolean; retrieval: "embeddings" | "keywords"; sources: Source[] };
type Turn = { role: "user" | "assistant"; content: string; reply?: Reply };

const starters = [
  "How long does shipping take?",
  "Can I return earrings?",
  "My silver necklace turned dark, what should I do?",
  "Is the Pearl Halo Necklace real gold?",
];

export default function Help() {
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
      const res = await postJSON<Reply>("/api/support", {
        messages: next.map(({ role, content }) => ({ role, content })),
      });
      setTurns([...next, { role: "assistant", content: res.answer, reply: res }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <p className="eyebrow">Customer Help</p>
      <h1>How can we help?</h1>
      <p className="lead">Ask about shipping, returns, materials or jewelry care. Answers come only from our store policies, with the sources shown.</p>

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
            {t.reply && <Sources reply={t.reply} />}
          </div>
        ))}
        {loading && <div className="bubble assistant muted">Searching our policies…</div>}
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
          placeholder="e.g. Do you ship to Canada?"
          maxLength={2000}
        />
        <button className="btn" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}

function Sources({ reply }: { reply: Reply }) {
  const used = reply.sources.filter((s) => s.used);
  return (
    <div className="sources">
      {used.length > 0 && <p className="small muted">Based on: {used.map((s) => s.title).join(" · ")}</p>}
      {!reply.answered && <p className="small muted">Not covered by our policies. Please email us and a person will help.</p>}
      <details>
        <summary className="small muted">How this answer was found</summary>
        <p className="small muted">
          Search method: {reply.retrieval === "embeddings" ? "semantic embeddings" : "keyword TF-IDF"}. Top matches by
          similarity score:
        </p>
        <ol className="small muted">
          {reply.sources.map((s) => (
            <li key={s.id}>
              {s.title} ({s.score.toFixed(2)}){s.used ? ", used in answer" : ""}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
