"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/lib/post";

// "Cancel and refund" before the order ships, "Request a return" after.
export default function RefundButton({ sessionId, shipped }: { sessionId: string; shipped: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await postJSON("/api/orders/refund", { sessionId, reason });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-outline btn-small" onClick={() => setOpen(true)}>
        {shipped ? "Request a return" : "Cancel and refund"}
      </button>
    );
  }
  return (
    <div className="refund-form">
      <p className="hint">
        {shipped
          ? "Unworn pieces in their original packaging can be returned within 30 days of delivery. Earrings can only be returned with the seal unopened. We will email you return instructions."
          : "This order has not shipped yet, so it will be cancelled and refunded to your card right away."}
      </p>
      <textarea
        rows={2}
        placeholder="Reason (optional)"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="row">
        <button type="button" className="btn btn-small" onClick={submit} disabled={loading}>
          {loading ? "Submitting…" : shipped ? "Submit return request" : "Confirm refund"}
        </button>
        <button type="button" className="btn btn-outline btn-small" onClick={() => setOpen(false)} disabled={loading}>
          Keep order
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
