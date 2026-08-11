"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { BuiltBook, GlbBook } from "@/components/Intro3D";

/* The dismissed state: the tomb stays behind, and the closed tome hangs
   in the room in front of it. Drag turns it in your hands; a tap (not a
   drag) opens the reader again. */

function SpinnableBook({
  useGlb,
  spinRef,
}: {
  useGlb: boolean;
  spinRef: React.MutableRefObject<{ vx: number; vy: number; rx: number; ry: number }>;
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

    // embers only: the gilding keeps a candle-lit life, well below the
    // intro's ignition (and with no bloom composer to amplify it)
    igniteRef.current = 0.32 + 0.05 * Math.sin(t * 2.3) * Math.sin(t * 0.7);
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#ffdcb0" />
      <spotLight position={[2.4, 2.6, 3.4]} intensity={38} angle={0.7} penumbra={0.6} color="#ffd9a2" />
      <pointLight position={[-2.4, 0.6, -3]} intensity={26} color="#ff8f3c" />
      <pointLight position={[-1.6, -1.4, 2.6]} intensity={10} color="#ffc890" />
      <group ref={group} scale={0.92}>
        {useGlb ? <GlbBook igniteRef={igniteRef} /> : <BuiltBook igniteRef={igniteRef} />}
      </group>
    </>
  );
}

export default function ClosedBook({ onOpen }: { onOpen: () => void }) {
  // same GLB detection as the intro; the HEAD hits the browser cache
  const [glb, setGlb] = useState<boolean | null>(null);
  const spinRef = useRef({ vx: 0, vy: 0, rx: 0, ry: 0 });
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);

  useEffect(() => {
    fetch("/book.glb", { method: "HEAD" })
      .then((r) => {
        const ok = r.ok && (r.headers.get("content-type") ?? "").includes("model");
        if (ok) useGLTF.preload("/book.glb");
        setGlb(ok);
      })
      .catch(() => setGlb(false));
  }, []);

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
      {glb !== null && (
        <Canvas
          camera={{ position: [0, 0, 4.15], fov: 40 }}
          gl={{ antialias: true }}
          dpr={
            typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
              ? [1, 1.5]
              : [1, 1.75]
          }
        >
          <SpinnableBook useGlb={glb} spinRef={spinRef} />
        </Canvas>
      )}
      <div className="closedHint">drag to turn it over · tap to open</div>
    </div>
  );
}
