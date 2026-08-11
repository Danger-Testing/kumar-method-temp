"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";
import TombScene from "@/components/TombScene";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });
const ClosedBook = dynamic(() => import("@/components/ClosedBook"), { ssr: false });

import type { HoleRect } from "@/components/Intro3D";

export default function Experience() {
  const [phase, setPhase] = useState<"tomb" | "intro" | "book" | "closed">("tomb");
  const [flash, setFlash] = useState(false);
  // inspection mode: strips the added lighting, relief, and glow wherever
  // the 3D book is on stage (closed view now; intro once it takes the prop)
  const [plain, setPlain] = useState(false);
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
          }}
          onDone={(finished) => {
            setFlash(finished);
            setPhase("book");
          }}
        />
      )}

      {phase === "closed" && <ClosedBook onOpen={() => setPhase("book")} plain={plain} />}

      {/* the lights-off toggle lives wherever the 3D book can appear —
          landing, intro, and the closed book; the reader corner belongs
          to the business CTA */}
      {phase !== "book" && (
        <button
          className="plainToggle"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setPlain((p) => !p);
          }}
        >
          {plain ? "lights on" : "lights off"}
        </button>
      )}

      {phase === "book" && (
        <>
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
