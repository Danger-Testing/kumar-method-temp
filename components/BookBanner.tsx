"use client";

import { useLayoutEffect, useRef, useState } from "react";

/* The ribbon (Kendall's mock, 2026-08-12): a parchment banner hanging
   from the bottom edge of the held book — the tagline in the book's
   own paper, an ornamental rule, and the email capture inline.

   It renders INSIDE the 3D scene via drei's <Html transform>, parented
   to the book's bottom-center anchor (see the ribbon groups in
   Intro3D/ClosedBook) — so it turns, sways and dives in real
   perspective with the book. The canvas paints the book OVER it
   (z-order), so it emerges from behind the back cover. */

/** Scene-container guard (defense in depth): the ribbon's own
    stopPropagation lives inside drei's separate React root, and WebKit
    is known to mis-hit-test 3D-transformed DOM — either can leak a tap
    on the email field into "open the book". The containers call this
    with the tap point: inside the paper's screen rect → swallow the
    tap, and hand focus/submit to the controls if the engine didn't. */
export function bannerTapGuard(root: HTMLElement, x: number, y: number, act = false): boolean {
  const paper = root.querySelector(".bannerPaper");
  if (!paper) return false;
  const r = paper.getBoundingClientRect();
  if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
  // act: route the tap to the control by hand (once per tap — the UP
  // phase), in case the engine never delivered it
  if (act) {
    const input = root.querySelector<HTMLInputElement>(".bannerForm input");
    if (input) {
      const ir = input.getBoundingClientRect();
      if (x >= ir.left - 6 && x <= ir.right + 6 && y >= ir.top - 10 && y <= ir.bottom + 10) {
        if (document.activeElement !== input) input.focus();
        return true;
      }
    }
    const button = root.querySelector<HTMLButtonElement>(".bannerForm button");
    if (button) {
      const br = button.getBoundingClientRect();
      if (x >= br.left - 6 && x <= br.right + 6 && y >= br.top - 10 && y <= br.bottom + 10) {
        button.click();
      }
    }
  }
  return true;
}

/** the engraved gold hairline that follows the swallowtail outline —
    drawn from the paper's measured box so it tracks the notch */
function GoldFrame({ paper }: { paper: React.RefObject<HTMLDivElement | null> }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = paper.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [paper]);
  if (!box.w) return null;
  const { w, h } = box;
  const i = 10; // frame inset; the paper's notch is 22px deep
  const d = `M ${i} ${i} L ${w - i} ${i} L ${w - i} ${h - i - 8} L ${w / 2} ${h - 30} L ${i} ${h - i - 8} Z`;
  return (
    <svg className="bannerFrame" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function BookBanner({
  hold = false,
  show = true,
}: {
  /** intro-hold variant: fades in/out with the hold instead of the
      mount animation */
  hold?: boolean;
  /** hold only: visible while the hold lasts */
  show?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const paperRef = useRef<HTMLDivElement>(null);

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
      <div className="bannerPaper" ref={paperRef} onPointerDown={stop} onPointerUp={stop} onClick={stop}>
        {/* baked handmade-paper relief (PIL, from the reader's aged
            scan) — the mock's stucco-like tooth */}
        <span className="bannerRelief" aria-hidden="true" />
        <GoldFrame paper={paperRef} />
        <div className="bannerLines">
          <span className="bLife">Use The Kumar Method to run your life.</span>
          <span className="bBiz">
            Use <span className="rampMark" aria-hidden="true" />
            <strong>ramp</strong> to run your business.
          </span>
        </div>
        <div className="bannerRule" aria-hidden="true">
          <b />
          <i />
          <b />
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
