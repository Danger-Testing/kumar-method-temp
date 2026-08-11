"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";
import TombScene from "@/components/TombScene";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });

export default function Experience() {
  const [phase, setPhase] = useState<"tomb" | "intro" | "book">("tomb");
  const [flash, setFlash] = useState(false);
  const tombHostRef = useRef<HTMLDivElement>(null);

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
        </div>
      )}

      {phase === "intro" && (
        <Intro3D
          emerge
          onTombFade={(fade) => {
            const el = tombHostRef.current;
            if (!el) return;
            el.style.opacity = String(1 - fade);
            // shed video decode cost as soon as it stops being visible:
            // the fullscreen smoke goes first, everything once hidden
            if (fade > 0.5) {
              el.querySelector<HTMLVideoElement>(".km-landing-general-smoke")?.pause();
            }
            if (fade >= 1 && el.style.visibility !== "hidden") {
              el.style.visibility = "hidden";
              el.querySelectorAll("video").forEach((v) => v.pause());
            }
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
