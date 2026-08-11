"use client";

import { useEffect, useRef } from "react";

/* The homepage: Kumar's tomb in the dark, smoke drifting, waiting to be
   woken. Assets from marcgmbh/kumarmethod-website (tomb branch).
   Clicking anywhere wakes the book. */
export default function TombLanding({ onWake }: { onWake: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  // gentle cursor parallax, eased like Marc's landing
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      target.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
      if (frame.current !== null) return;
      const animate = () => {
        pos.current.x += (target.current.x - pos.current.x) * 0.12;
        pos.current.y += (target.current.y - pos.current.y) * 0.12;
        el.style.setProperty("--tx", pos.current.x.toFixed(4));
        el.style.setProperty("--ty", pos.current.y.toFixed(4));
        const settled =
          Math.abs(target.current.x - pos.current.x) < 0.002 &&
          Math.abs(target.current.y - pos.current.y) < 0.002;
        frame.current = settled ? null : requestAnimationFrame(animate);
      };
      frame.current = requestAnimationFrame(animate);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") onWake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onWake]);

  return (
    <div className="tombScene" ref={rootRef} onClick={onWake} role="button" aria-label="Wake the book" tabIndex={0}>
      <img className="tombBg" src="/tomb/bg.webp" alt="" aria-hidden="true" />
      <img className="tombWall" src="/tomb/wall.png" alt="" aria-hidden="true" />
      <img className="tombStructure" src="/tomb/kumar-tomb-final.png" alt="The tomb of Kumar" />
      <video
        className="tombSmoke"
        src="/tomb/general-smoke.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="tombVignette" aria-hidden="true" />
      <div className="tombHint">tap the tomb to wake the book</div>
    </div>
  );
}
