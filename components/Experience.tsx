"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";
import TombScene from "@/components/TombScene";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });

import type { HoleRect } from "@/components/Intro3D";

export default function Experience() {
  const [phase, setPhase] = useState<"tomb" | "intro" | "book">("tomb");
  const [flash, setFlash] = useState(false);
  const tombHostRef = useRef<HTMLDivElement>(null);
  // the doorway hole, as viewport fractions: derived from .km-tomb-frame's
  // rect and its interior clip-path polygon in kumar.css
  // (x 45.9–54.1%, y 49–78.6% of the frame)
  const holeRef = useRef<HoleRect | null>(null);

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
    // tomb: the three.js chunk (which preloads the cover textures) and
    // the book mesh itself
    import("@/components/Intro3D");
    fetch("/book.glb").catch(() => {});
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
      {(phase === "tomb" || phase === "intro") && (
        <div className="tombHost" ref={tombHostRef}>
          <main className="km-site">
            <div className="km-transition-stage km-transition-landing">
              <TombScene
                interactive={phase === "tomb"}
                onWake={() => setPhase("intro")}
              />
            </div>
          </main>
          {/* the awakening's light on the chamber — opacity driven per
              frame by the ignition */}
          <div className="tombGlowWash" aria-hidden="true" />
        </div>
      )}

      {phase === "intro" && (
        <Intro3D
          emerge
          holeRect={holeRef}
          onTombFade={(fade, glow) => {
            // the scene stays alive behind the book instead of dying to
            // black: the room settles at 70% dark, the tomb at 40% — and
            // when the gilding ignites, its glow lights the whole chamber
            // back up, flickering with the awakening
            const el = tombHostRef.current;
            if (!el) return;
            const bg = el.querySelector<HTMLElement>(".km-landing-background");
            const frame = el.querySelector<HTMLElement>(".km-tomb-frame");
            const smoke = el.querySelector<HTMLVideoElement>(".km-landing-general-smoke");
            const wash = el.querySelector<HTMLElement>(".tombGlowWash");
            if (bg) {
              // preserve Marc's base grade, add the darkening + glow lift
              bg.style.filter = `saturate(.78) contrast(1.05) brightness(${((1 - 0.7 * fade) * (1 + 0.55 * glow)).toFixed(3)})`;
            }
            if (frame) {
              // the stone catches the most light
              frame.style.filter = `brightness(${((1 - 0.4 * fade) * (1 + 0.7 * glow)).toFixed(3)})`;
            }
            // scale Marc's base opacity (.52), never replace it — writing
            // 1.0 here doubled the smoke into a fog wall on click
            if (smoke) smoke.style.opacity = (0.52 * (1 - 0.7 * fade)).toFixed(3);
            if (wash) wash.style.opacity = (0.5 * glow).toFixed(3);
          }}
          onDone={(finished) => {
            setFlash(finished);
            setPhase("book");
          }}
        />
      )}

      {phase === "book" && (
        <>
          <Book />
          {/* closing the book returns to the tomb landing; the host remounts
              fresh, so the awakening can play again untouched by the old
              per-layer grading. Waits out the handoff flash. */}
          {!flash && (
          <button
            className="closeBook"
            aria-label="Close the book"
            onClick={() => {
              setFlash(false);
              setPhase("tomb");
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
