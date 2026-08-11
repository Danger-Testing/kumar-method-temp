"use client";

import { useState, type FormEvent } from "react";

export default function EnterpriseAccessModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // React nulls event.currentTarget once the handler's synchronous
    // phase ends — capture the form before any await or .reset() throws
    const form = event.currentTarget;
    setStatus("submitting");
    setError("");
    const response = await fetch("/api/enterprise-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "Please try again.");
      setStatus("error");
      return;
    }
    form.reset();
    setStatus("success");
  }

  return (
    <div className="enterpriseModalBackdrop" role="presentation" onClick={onClose}>
      <div className="enterpriseModal" role="dialog" aria-modal="true" aria-labelledby="enterprise-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="enterpriseModalClose" onClick={onClose} aria-label="Close">×</button>
        <h2 id="enterprise-title">Get access</h2>
        <form onSubmit={submit}>
          <label>Name<input name="name" autoComplete="name" placeholder="your name" required /></label>
          <label>Company<input name="company" autoComplete="organization" placeholder="your company" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
          {status === "success" && <p className="enterpriseFormSuccess">Thanks — we’ll be in touch shortly.</p>}
          {status === "error" && <p className="enterpriseFormError">{error}</p>}
          <button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Sending…" : "Get access"}</button>
        </form>
      </div>
    </div>
  );
}
