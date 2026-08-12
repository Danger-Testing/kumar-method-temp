"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { TheBook, BookLights, igniteDrive, ribbonPin, bookRect } from "@/components/TheBook";
import BookBanner, { bannerTapGuard } from "@/components/BookBanner";

const PIN = new THREE.Vector3();
const RECT = { l: 0, t: 0, r: 0, b: 0 };

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
  portalEl,
  hotspotEl,
}: {
  spinRef: React.MutableRefObject<{ vx: number; vy: number; rx: number; ry: number }>;
  plain: boolean;
  /** where the ribbon's DOM portals to (the scene root — NOT the
      canvas wrapper, whose pointer-events are nuked) */
  portalEl: React.MutableRefObject<HTMLDivElement>;
  /** the cursor hotspot over the book — repositioned every frame */
  hotspotEl: React.MutableRefObject<HTMLDivElement>;
}) {
  const group = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Group>(null);
  const swing = useRef({ x: 0, y: 0 });
  const igniteRef = useRef(0);

  useFrame(({ clock, camera, size }) => {
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

    // the ribbon: PINNED to the back cover's bottom edge, so it orbits
    // and dips with every turn of the book. Its plane swings with the
    // drag velocity and gravity untwists it back toward the room —
    // cloth, not a weld (a welded plane spends most of the idle spin
    // edge-on and the email line becomes unreadable).
    const r = ribbon.current;
    if (r) {
      ribbonPin(g, camera, PIN);
      r.position.copy(PIN);
      const sw = swing.current;
      sw.y += (THREE.MathUtils.clamp(s.vy * 26, -0.6, 0.6) - sw.y) * 0.07;
      sw.x += (THREE.MathUtils.clamp(-s.vx * 16, -0.3, 0.3) - sw.x) * 0.07;
      r.rotation.set(sw.x, sw.y, sw.y * -0.12);
      r.scale.setScalar(0.92);
    }

    // the cursor hotspot hugs the book: pointer over the tome only
    if (hotspotEl.current) {
      bookRect(g, camera, size.width, size.height, RECT);
      const el = hotspotEl.current;
      el.style.left = `${RECT.l.toFixed(1)}px`;
      el.style.top = `${RECT.t.toFixed(1)}px`;
      el.style.width = `${(RECT.r - RECT.l).toFixed(1)}px`;
      el.style.height = `${(RECT.b - RECT.t).toFixed(1)}px`;
    }
  });

  return (
    <>
      <BookLights plain={plain} />
      <group ref={group} scale={0.92}>
        <TheBook igniteRef={igniteRef} plain={plain} />
      </group>
      <group ref={ribbon}>
        <Html transform distanceFactor={1} zIndexRange={[1, 1]} portal={portalEl} wrapperClass="bannerWrap3d">
          <div className="bannerHang">
            <BookBanner />
          </div>
        </Html>
      </group>
    </>
  );
}

export default function ClosedBook({
  onOpen,
  active = true,
  plain = false,
}: {
  onOpen: () => void;
  /** false = standby: pre-mounted invisibly under the reader, rendering
      once so the dismissal reveal is instant */
  active?: boolean;
  /** inspection mode, owned by Experience: no warm rig, no relief, no glow */
  plain?: boolean;
}) {
  const spinRef = useRef({ vx: 0, vy: 0, rx: 0, ry: 0 });
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null!);
  const hotspotRef = useRef<HTMLDivElement>(null!);

  return (
    <div
      ref={rootRef}
      className={`closedBook ${active ? "" : "closedStandby"}`}
      onPointerDown={(e) => {
        // touches on the ribbon are the ribbon's (WebKit can route
        // them here despite the banner's own stopPropagation)
        if (bannerTapGuard(e.currentTarget, e.clientX, e.clientY)) return;
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
      onPointerUp={(e) => {
        // a tap, not a drag, opens the book — and only a tap ON the
        // book (owner, 2026-08-12); the ribbon and the room around it
        // do nothing
        if (drag.current && drag.current.moved < 8 && !bannerTapGuard(e.currentTarget, e.clientX, e.clientY, true)) {
          const r = hotspotRef.current?.getBoundingClientRect();
          if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
            onOpen();
          }
        }
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <Canvas
        className="glCanvas"
        camera={{ position: [0, 0, 4.15], fov: 40 }}
        gl={{ antialias: true }}
        dpr={isCoarse() ? [1, 1.5] : [1, 1.75]}
        frameloop={active ? "always" : "demand"}
      >
        <SpinnableBook spinRef={spinRef} plain={plain} portalEl={rootRef} hotspotEl={hotspotRef} />
      </Canvas>
      {/* the held-book hero copy: instruction above (book voice), and
          below, the parchment ribbon hanging from the book — tagline +
          email capture in one (Kendall's mock, 2026-08-12; replaced the
          clickable tagline + modal) */}
      <div className="closedTitle">Drag to turn it over. Tap to open.</div>
      {/* cursor hotspot: pointer over the tome, arrow elsewhere */}
      <div className="bookHotspot" ref={hotspotRef} aria-hidden="true" />
    </div>
  );
}
