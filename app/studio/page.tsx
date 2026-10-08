"use client";

import Link from "next/link";
import { useState } from "react";
import { postJSON } from "@/lib/post";

type Copy = {
  productName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  metaDescription: string;
  altText: string;
  tags: string[];
  needsCheck: string[];
};

// Vercel caps request bodies at 4.5 MB, and base64 adds about a third.
const MAX_BYTES = 3 * 1024 * 1024;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Studio() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [notes, setNotes] = useState("");
  const [copy, setCopy] = useState<Copy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    if (f && f.size > MAX_BYTES) {
      setError("Please choose an image under 3 MB.");
      return;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setCopy(null);
    try {
      const image = await readAsBase64(file);
      setCopy(await postJSON<Copy>("/api/copy", { image, mediaType: file.type, notes }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const fields: [string, keyof Copy][] = [
    ["Product name", "productName"],
    ["Short description", "shortDescription"],
    ["Product page description", "longDescription"],
    ["SEO title", "seoTitle"],
    ["Meta description", "metaDescription"],
    ["Image alt text", "altText"],
  ];

  return (
    <div className="page narrow">
      <p className="eyebrow">Studio tools · for the shop owner</p>
      <h1>Product copy from a photo</h1>
      <p className="small"><Link href="/studio/triage" className="link">Custom request triage: let an AI agent assess a custom-design request →</Link></p>
      <p className="lead">Upload a photo of a new piece. Get a product description, SEO text and tags in seconds.</p>

      <form className="form" onSubmit={submit}>
        <label>Product photo
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} required />
        </label>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Preview" className="preview" />}
        <label>Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Facts to include, e.g. 14k gold, natural pearl, $180, handmade in small batches"
            maxLength={1000}
          />
        </label>
        <button className="btn" disabled={loading || !file}>{loading ? "Writing…" : "Write product copy"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {copy && (
        <div className="result">
          {copy.needsCheck.length > 0 && (
            <div className="warn">
              <strong>Please confirm before publishing:</strong>
              <ul>{copy.needsCheck.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          {fields.map(([label, key]) => (
            <div key={key} className="field-out">
              <div className="field-head">
                <span>{label}</span>
                <button className="link-btn" onClick={() => navigator.clipboard?.writeText(String(copy[key]))}>Copy</button>
              </div>
              <p>{String(copy[key])}</p>
            </div>
          ))}
          <div className="field-out">
            <div className="field-head"><span>Tags</span></div>
            <p>{copy.tags.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
