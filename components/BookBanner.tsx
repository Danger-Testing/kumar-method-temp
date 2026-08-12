"use client";

import { useState } from "react";

/* The ribbon (Kendall's mock, 2026-08-12): a parchment banner hanging
   from the bottom edge of the held book — the tagline in the book's
   own paper, an ornamental rule, and the email capture inline. It
   replaces the clickable-tagline + modal path on the hold and closed
   screens, so every screen with the book carries lead capture,
   phones included. */
export default function BookBanner({
  hold = false,
  show = true,
}: {
  /** intro-hold variant: sits lower (the held book is larger) and
      fades in/out with the hold instead of the mount animation */
  hold?: boolean;
  /** hold only: visible while the hold lasts */
  show?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  // the paper must never read as a tap on the book behind it: taps on
  // the closed book open the reader, clicks on the intro root release
  // the hold
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    // captured before any await — React nulls currentTarget after
    const form = event.currentTarget;
    const raw = new FormData(form).get("email");
    const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setError("Please enter a valid work email.");
      return;
    }
    setStatus("pending");
    setError("");
    try {
      const res = await fetch("/api/enterprise-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "We couldn't save that. Please try again.");
      }
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "We couldn't save that. Please try again.");
    }
  }

  return (
    <div className={`bookBanner ${hold ? `heroWait ${show ? "heroShow" : ""}` : ""}`}>
      <div className="bannerPaper" onPointerDown={stop} onPointerUp={stop} onClick={stop}>
        <div className="bannerLines">
          <span className="bLife">Use The Kumar Method to run your life.</span>
          <span className="bBiz">
            Use <span className="rampMark" aria-hidden="true" />
            <strong>ramp</strong> to run your business.
          </span>
        </div>
        <div className="bannerRule" aria-hidden="true">
          <i />
        </div>
        {status === "ok" ? (
          <p className="bannerNote">Thanks — we&rsquo;ll be in touch shortly.</p>
        ) : (
          <form className="bannerForm" onSubmit={submit}>
            <input
              type="email"
              name="email"
              placeholder="Enter your work email"
              autoComplete="email"
              aria-label="Work email"
              disabled={status === "pending"}
            />
            <button type="submit" aria-label="Submit email" disabled={status === "pending"}>
              <span aria-hidden="true">&#10142;</span>
            </button>
          </form>
        )}
        {status === "error" && <p className="bannerErr">{error}</p>}
      </div>
    </div>
  );
}
