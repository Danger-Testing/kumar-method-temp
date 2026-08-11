"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { TheBook, BookLights, igniteDrive } from "@/components/TheBook";

/** coarse pointer ≈ phone/tablet: render leaner there (mirrors Intro3D) */
function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/* The dismissed state: the tomb stays behind, and the closed tome hangs
   in the room in front of it. Drag turns it in your hands; a tap (not a
   drag) opens the reader again. */

function SpinnableBook({
  spinRef,
  plain,
}: {
  spinRef: React.MutableRefObject<{ vx: number; vy: number; rx: number; ry: number }>;
  plain: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const igniteRef = useRef(0);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const s = spinRef.current;

    // momentum from the last drag, decaying like a heavy object in hands
    s.ry += s.vy;
    s.rx += s.vx;
    s.vx *= 0.94;
    s.vy *= 0.94;
    // a slow idle turn when left alone, so it always feels alive
    s.ry += 0.0016;
    // never quite upside down
    s.rx = Math.max(-0.9, Math.min(0.9, s.rx));

    g.rotation.y = s.ry;
    g.rotation.x = s.rx + Math.sin(t * 1.1) * 0.012;
    g.position.y = Math.sin(t * 1.3) * 0.03;

    // ONE glow: the canonical drive from TheBook — restored after the
    // sparkle artifact turned out to be bump-map glints, not the glow
    igniteRef.current = plain ? 0 : igniteDrive(t);
  });

  return (
    <>
      <BookLights plain={plain} />
      <group ref={group} scale={0.92}>
        <TheBook igniteRef={igniteRef} plain={plain} />
      </group>

    </>
  );
}

export default function ClosedBook({
  onOpen,
  plain = false,
}: {
  onOpen: () => void;
  /** inspection mode, owned by Experience: no warm rig, no relief, no glow */
  plain?: boolean;
}) {
  const spinRef = useRef({ vx: 0, vy: 0, rx: 0, ry: 0 });
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);

  return (
    <div
      className="closedBook"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        d.moved += Math.abs(dx) + Math.abs(dy);
        d.x = e.clientX;
        d.y = e.clientY;
        spinRef.current.vy = dx * 0.004;
        spinRef.current.vx = dy * 0.003;
      }}
      onPointerUp={() => {
        // a tap, not a drag, opens the book
        if (drag.current && drag.current.moved < 8) onOpen();
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.15], fov: 40 }}
        gl={{ antialias: true }}
        dpr={isCoarse() ? [1, 1.5] : [1, 1.75]}
      >
        <SpinnableBook spinRef={spinRef} plain={plain} />
      </Canvas>
      <div className="closedHint">drag to turn it over · tap to open</div>
    </div>
  );
}
