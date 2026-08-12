"use client";

import { useState } from "react";
import * as THREE from "three";
import { BOOK_H, BOOK_W, BOOK_D } from "@/components/TheBook";

/* scratch vectors for driveBanner — never allocate in a frame loop */
const ANCHOR = new THREE.Vector3();
const WORLD_SCALE = new THREE.Vector3();

export type BannerSmooth = { x: number; y: number; w: number };

/** Called from a scene's useFrame: glues the DOM ribbon to the 3D
    book's bottom edge (back cover), so every movement of the book —
    bob, drag-spin, the dive — carries the ribbon with it. The lerp
    gives it a slight cloth lag instead of a rigid weld. */
export function driveBanner(
  el: HTMLDivElement,
  book: THREE.Group,
  camera: THREE.Camera,
  size: { width: number; height: number },
  sm: BannerSmooth,
) {
  book.updateWorldMatrix(true, false);
  // the attachment point: bottom-center of the BACK cover
  ANCHOR.set(0, -BOOK_H / 2, -BOOK_D / 2);
  book.localToWorld(ANCHOR);
  // px-per-world-unit at the anchor's depth — the ribbon keeps the
  // BOOK's width (not the projected edge, which thins when it yaws)
  const cam = camera as THREE.PerspectiveCamera;
  const dist = ANCHOR.distanceTo(camera.position);
  const pxPerWorld = size.height / (2 * dist * Math.tan((cam.fov * Math.PI) / 360));
  const w = Math.min(
    size.width * 0.94,
    Math.max(240, BOOK_W * book.getWorldScale(WORLD_SCALE).x * pxPerWorld * 0.94),
  );
  ANCHOR.project(camera);
  const ax = ((ANCHOR.x + 1) / 2) * size.width;
  const ay = ((1 - ANCHOR.y) / 2) * size.height;
  const h = el.offsetHeight || 220;
  // tucked 16px behind the cover (the canvas paints the book OVER the
  // ribbon's top). On short viewports the ribbon buries up to 18px
  // MORE of its blank top parchment (the paper's 38px top padding is
  // the budget — the tagline itself must never go under the book);
  // any remainder just clips the tail tips at the fold.
  const attachY = ay - 16;
  const overflow = attachY + h - (size.height - 4);
  const ty = overflow > 0 ? attachY - Math.min(overflow, 18) : attachY;
  if (sm.w === 0) {
    sm.x = ax;
    sm.y = ty;
    sm.w = w;
  }
  sm.x += (ax - sm.x) * 0.16;
  sm.y += (ty - sm.y) * 0.16;
  sm.w += (w - sm.w) * 0.16;
  el.style.left = "0";
  el.style.top = "0";
  el.style.width = `${sm.w.toFixed(1)}px`;
  el.style.transform = `translate3d(${(sm.x - sm.w / 2).toFixed(1)}px, ${sm.y.toFixed(1)}px, 0)`;
}

/* The ribbon (Kendall's mock, 2026-08-12): a parchment banner hanging
   from the bottom edge of the held book — the tagline in the book's
   own paper, an ornamental rule, and the email capture inline. It
   replaces the clickable-tagline + modal path on the hold and closed
   screens, so every screen with the book carries lead capture,
   phones included. */
export default function BookBanner({
  hold = false,
  show = true,
  outerRef,
}: {
  /** intro-hold variant: fades in/out with the hold instead of the
      mount animation */
  hold?: boolean;
  /** hold only: visible while the hold lasts */
  show?: boolean;
  /** the scene writes this element's position/width every frame via
      driveBanner — the ribbon rides the book */
  outerRef?: React.RefObject<HTMLDivElement | null>;
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
    <div ref={outerRef} className={`bookBanner ${hold ? `heroWait ${show ? "heroShow" : ""}` : ""}`}>
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
