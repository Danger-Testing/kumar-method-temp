"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Book, { ILLUSTRATIONS } from "@/components/Book";
import TombScene from "@/components/TombScene";
// The quiz is OFF the site for now (owner, 2026-08-12) — the questions
// live on in components/KumarQuiz.tsx, wiring is one import away.
// The get-access modal is retired too (owner/Kendall, 2026-08-13): the
// tail's email → ramp link is THE capture everywhere. The component
// stays in components/EnterpriseAccessModal.tsx.

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });
const ClosedBook = dynamic(() => import("@/components/ClosedBook"), { ssr: false });
// The spinnable ClosedBook is RETIRED from the flow (sponsor call,
// 2026-08-12: the dismissed state is the held opening now) but kept
// safe in components/ClosedBook.tsx — one import away if wanted back.

import type { HoleRect } from "@/components/Intro3D";

export default function Experience() {
  // launches straight into the emergence (owner call 2026-08-11) — the
  // click-to-wake tomb gate is retired but the phase remains for the
  // closed-book flow and any future re-gating
  const [phase, setPhase] = useState<"tomb" | "intro" | "book" | "closed">("intro");
  const [flash, setFlash] = useState(false);
  // remount key for the held (dismissed-state) instance: each dive
  // finishes its timeline, so the next dismissal needs a fresh one
  const [heldGen, setHeldGen] = useState(0);
  // Lights are ON, period (owner call, 2026-08-11 after the glow was
  // dialed to its final level). The plain/inspection plumbing survives
  // in the components; there is deliberately no UI for it anymore.
  const plain = false;
  const tombHostRef = useRef<HTMLDivElement>(null);
  // the doorway hole, as viewport fractions: derived from .km-tomb-frame's
  // rect and its interior clip-path polygon in kumar.css
  // (x 45.9–54.1%, y 49–78.6% of the frame)
  const holeRef = useRef<HoleRect | null>(null);

  // the scene stays alive behind the book instead of dying to black:
  // the room settles at 70% dark, the tomb at 40% — and when the
  // gilding ignites, its glow lights the whole chamber back up,
  // flickering with the awakening. Shared by the intro AND the held
  // (dismissed-state) instance.
  const gradeTomb = (fade: number, glow: number, doorGlow = 0) => {
    const el = tombHostRef.current;
    if (!el) return;
    const bg = el.querySelector<HTMLElement>(".km-landing-background");
    const frame = el.querySelector<HTMLElement>(".km-tomb-frame");
    const smoke = el.querySelector<HTMLVideoElement>(".km-landing-general-smoke");
    const stone = el.querySelector<HTMLElement>(".tombLitStone");
    const floor = el.querySelector<HTMLElement>(".tombFloorLight");
    if (bg) {
      // preserve Marc's base grade, add the darkening + glow lift —
      // at full ignition the room floods with light
      bg.style.filter = `saturate(.78) contrast(1.05) brightness(${((1 - 0.7 * fade) * (1 + 1.7 * glow)).toFixed(3)})`;
    }
    if (frame) {
      // the stone catches the most light — it blazes at the crest
      frame.style.filter = `brightness(${((1 - 0.4 * fade) * (1 + 2 * glow)).toFixed(3)})`;
    }
    // scale Marc's base opacity (.52), never replace it — writing
    // 1.0 here doubled the smoke into a fog wall on click
    if (smoke) smoke.style.opacity = (0.52 * (1 - 0.7 * fade)).toFixed(3);
    if (stone) stone.style.opacity = Math.min(1, glow).toFixed(3);
    if (floor) floor.style.opacity = Math.min(1, 0.95 * glow).toFixed(3);
    const door = el.querySelector<HTMLElement>(".tombDoorGlow");
    if (door) door.style.opacity = Math.min(1, doorGlow).toFixed(3);
  };

  useEffect(() => {
    const measure = () => {
      const frame = tombHostRef.current?.querySelector<HTMLElement>(".km-tomb-frame");
      if (!frame) return;
      const r = frame.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!vw || !vh) return;
      holeRef.current = {
        cx: (r.left + r.width * 0.5) / vw,
        cy: (r.top + r.height * ((0.49 + 0.786) / 2)) / vh,
        w: (r.width * (0.541 - 0.459)) / vw,
        h: (r.height * (0.786 - 0.49)) / vh,
      };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [phase]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("book");
    }
    // warm everything the click will need while the visitor looks at the
    // tomb: the three.js chunk pulls in TheBook, whose module preloads
    // all the book textures (~700KB total — no more 4.8MB GLB fetch)
    import("@/components/Intro3D");
    import("@/components/ClosedBook"); // pre-warm: dismissing must be seamless
    // and the lesson illustrations — the intro is ~10s of idle network,
    // so the reader never sees them pop in (owner report)
    Object.values(ILLUSTRATIONS).forEach(({ src }) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (phase !== "tomb") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") setPhase("intro");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  return (
    <>
      {/* The tomb never unmounts between landing and intro — same DOM,
          same playing videos — so waking the book cannot flash. */}
      {(phase === "tomb" || phase === "intro" || phase === "closed") && (
        <div className="tombHost" ref={tombHostRef}>
          <main className="km-site">
            <div className="km-transition-stage km-transition-landing">
              <TombScene
                interactive={phase === "tomb"}
                onWake={() => setPhase("intro")}
              />
            </div>
          </main>
        </div>
      )}

      {phase === "intro" && (
        <Intro3D
          emerge
          plain={plain}
          holeRect={holeRef}
          onTombFade={gradeTomb}
          onDone={(finished) => {
            setFlash(finished);
            setPhase("book");
          }}
        />
      )}

      {/* PREVIEW BRANCH: spinning tome on dismiss */}
      {(phase === "book" || phase === "closed") && (
        <ClosedBook active={phase === "closed"} onOpen={() => setPhase("book")} plain={plain} />
      )}

      {phase === "book" && (
        <>
          {/* lead capture inside the reader = the tail under the page
              (Book renders it); the corner CTA + modal are retired */}
          <Book />
          {/* closing the book: back to the tomb, with the closed tome
              hanging in the room — not all the way back to square one.
              Waits out the handoff flash. */}
          {!flash && (
          <button
            className="closeBook"
            aria-label="Close the book"
            onClick={() => {
              setFlash(false);
              setPhase("closed");
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2.5 2.5 L13.5 13.5 M13.5 2.5 L2.5 13.5"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
          )}
          {/* the page emerges out of the golden flash the dolly ended on */}
          {flash && (
            <div className="handoffFlash" onAnimationEnd={() => setFlash(false)}>
              <div className="rampLogo" aria-label="ramp" />
            </div>
          )}
        </>
      )}
    </>
  );
}
