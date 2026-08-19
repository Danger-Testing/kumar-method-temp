"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { assetBase } from "@/lib/asset";

/* Marc's landing, ported verbatim from marcgmbh/kumarmethod-website
   (tomb branch, src/app/page.tsx) — same markup, same easing, same
   layer order. The only change: clicking the tomb interior calls
   onWake instead of opening his shelf view. */
export default function TombScene({
  interactive = true,
  onWake,
}: {
  interactive?: boolean;
  onWake?: () => void;
}) {
  /* the smoke's path: "" until mounted, so the server's markup and the
     first client render agree, then the ramp.com embed's prefix (see
     lib/asset.ts — a <video src> is a JS string, which the platform
     does not rewrite). Off ramp.com this sets "" over "" and React
     bails out, so nothing re-renders. */
  const [base, setBase] = useState("");
  useEffect(() => setBase(assetBase()), []);

  const landingRef = useRef<HTMLElement>(null);
  const landingTargetRef = useRef({ x: 0, y: 0 });
  const landingPositionRef = useRef({ x: 0, y: 0 });
  const landingFrameRef = useRef<number | null>(null);

  const moveLandingTowardPointer = (x: number, y: number) => {
    landingTargetRef.current = { x, y };
    if (landingFrameRef.current !== null) return;

    const animate = () => {
      const target = landingTargetRef.current;
      const position = landingPositionRef.current;
      position.x += (target.x - position.x) * 0.14;
      position.y += (target.y - position.y) * 0.14;

      landingRef.current?.style.setProperty("--landing-x", position.x.toFixed(4));
      landingRef.current?.style.setProperty("--landing-y", position.y.toFixed(4));

      const settled =
        Math.abs(target.x - position.x) < 0.001 && Math.abs(target.y - position.y) < 0.001;
      if (settled) {
        position.x = target.x;
        position.y = target.y;
        landingFrameRef.current = null;
        return;
      }
      landingFrameRef.current = requestAnimationFrame(animate);
    };

    landingFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(
    () => () => {
      if (landingFrameRef.current !== null) cancelAnimationFrame(landingFrameRef.current);
    },
    []
  );

  // iOS (esp. Low Power Mode) blocks video autoplay and stamps a play
  // glyph over the paused element. Retry on the first touch (a user
  // gesture unlocks playback); if it still refuses, hide the smoke —
  // it's an enhancement, never worth a play button.
  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    const vids = Array.from(root.querySelectorAll("video"));
    const tryPlay = () => {
      vids.forEach((v) => {
        const p = v.play();
        if (p)
          p.then(() => v.classList.remove("smokeHidden")).catch(() =>
            v.classList.add("smokeHidden")
          );
      });
    };
    tryPlay();
    const unlock = () => tryPlay();
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    return () => window.removeEventListener("touchstart", unlock);
  }, []);

  return (
    <section
      className={`km-landing km-view-active ${interactive ? "km-wakeable" : ""}`}
      aria-label="Kumar welcome"
      ref={landingRef}
      onClick={interactive ? onWake : undefined}
      onPointerMove={
        interactive
          ? (event) => {
              if (event.pointerType === "touch") return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
              const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
              moveLandingTowardPointer(x, y);
            }
          : undefined
      }
      onPointerLeave={interactive ? () => moveLandingTowardPointer(0, 0) : undefined}
    >
      <div className="km-landing-artboard">
        <Image
          className="km-landing-image km-landing-background"
          src="/bg.webp"
          alt="A dark classical interior prepared for the Kumar tomb"
          fill
          priority
          sizes="100vw"
        />
        {/* marclos patch: the tomb layers live in a fixed-aspect frame so
            they never squish — only the background stretches with the
            window. The doorway clip-path percentages were calibrated to
            the image frame, so inside this box they stay aligned. */}
        <div className="km-tomb-frame">
          <div className="km-landing-tomb-interior">
            <video
              className="km-landing-tomb-smoke"
              src={`${base}/intomb-smoke.mp4`}
              autoPlay
              loop
              muted
              playsInline
            />
            {/* the doorway blazes bright yellow as the book wakes — clipped
                to the doorway polygon by the parent; driven per frame by
                Experience during the intro, inert on the landing */}
            <div className="tombDoorGlow" aria-hidden="true" />
          </div>
          <Image
            className="km-landing-image km-landing-tomb"
            src="/kumar-tomb-final.png"
            alt=""
            fill
            aria-hidden="true"
            sizes="100vw"
          />
          <Image
            className="km-landing-image km-landing-pots"
            src="/kumar-pots5.webp"
            alt=""
            fill
            aria-hidden="true"
            sizes="100vw"
          />
          {/* the mark on the plinth's left end (owner, 2026-08-19), the
              one clickable thing in the tomb — it stops its click from
              bubbling, or the book would wake under the visitor.
              Inside the frame, so it is fixed to the ARTWORK's rendered
              box rather than to the window — see .km-tomb-mark. */}
          <a
            className="km-tomb-mark"
            href="https://dangertesting.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Danger Testing"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <img src={`${base}/marks/main-white.svg`} alt="" draggable={false} />
          </a>
          {/* the awakening's light landing on the stone itself — masked by
              the tomb sprite so only real surfaces catch it (driven per
              frame by Experience during the intro; inert on the landing) */}
          <div className="tombLitStone" aria-hidden="true" />
        </div>
        {/* light pooling on the chamber floor beneath the doorway */}
        <div className="tombFloorLight" aria-hidden="true" />
        <svg className="km-landing-filters" aria-hidden="true" focusable="false">
          <defs>
            <filter id="km-general-smoke-alpha" colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  .299 .587 .114 0 -.20
                "
              />
            </filter>
          </defs>
        </svg>
        <video
          className="km-landing-general-smoke"
          src={`${base}/general-smoke.mp4`}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
