"use client";

/* TEMPORARY — /glow-test
   Comparison page: ① the delivered bookNew2.glb vs ③ TheBook — the
   site's single-source-of-truth book component (components/TheBook.tsx).
   This page imports the SAME component, glow drive, light rig, and bloom
   the site uses, so what you approve here is byte-identical to the app.
   Apple-style toggle top-left = glow on/off (default OFF).
   ?spin=&tilt=&glow=1 lock a deterministic pose for screenshot checks.
   Delete this route once the question is settled. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { TheBook, BookLights, BLOOM, BOOK_H, igniteDrive, IGNITE_FULL } from "@/components/TheBook";

type Spin = { rx: number; ry: number; vx: number; vy: number };

/* ① the delivered GLB, untouched */
function GlbBookAsDelivered() {
  const { scene } = useGLTF("/book.glb");
  const root = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material;
      const arr = Array.isArray(src) ? src : [src];
      const cloned = arr.map((m) => {
        const c = (m as THREE.MeshStandardMaterial).clone();
        c.normalScale?.multiplyScalar(0.05); // match the site's taming
        return c;
      });
      mesh.material = Array.isArray(src) ? cloned : cloned[0];
    });
    const root = new THREE.Group();
    const pre = new THREE.Box3().setFromObject(clone);
    const preSize = pre.getSize(new THREE.Vector3());
    if (preSize.z >= preSize.x && preSize.z >= preSize.y) {
      clone.rotation.x = -Math.PI / 2;
    }
    root.add(clone);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s = BOOK_H / size.y;
    root.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    root.position.sub(center);
    return root;
  }, [scene]);
  return <primitive object={root} />;
}

function Trio({
  spinRef,
  glowRef,
  fixed,
}: {
  spinRef: React.MutableRefObject<Spin>;
  glowRef: React.MutableRefObject<boolean>;
  fixed: { ry: number; rx: number } | null;
}) {
  const igRef = useRef(0);
  const gL = useRef<THREE.Group>(null);
  const gR = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = spinRef.current;
    if (fixed) {
      s.ry = fixed.ry;
      s.rx = fixed.rx;
      s.vx = s.vy = 0;
    } else {
      s.ry += s.vy;
      s.rx += s.vx;
      s.vx *= 0.94;
      s.vy *= 0.94;
      s.ry += 0.0012;
      s.rx = Math.max(-0.9, Math.min(0.9, s.rx));
    }
    // ONE glow: the canonical drive (steady mid-burn when pose-locked)
    igRef.current = glowRef.current ? (fixed ? 0.85 * IGNITE_FULL : igniteDrive(t)) : 0;
    [gL, gR].forEach((g) => {
      if (g.current) {
        g.current.rotation.y = s.ry;
        g.current.rotation.x = s.rx;
      }
    });
  });

  return (
    <>
      <group ref={gL} position={[-0.95, 0, 0]} scale={0.82}>
        <GlbBookAsDelivered />
      </group>
      <group ref={gR} position={[0.95, 0, 0]} scale={0.82}>
        <TheBook igniteRef={igRef} />
      </group>
    </>
  );
}

const col: React.CSSProperties = {
  position: "fixed",
  bottom: "3vh",
  width: "44%",
  color: "rgba(233, 214, 178, 0.72)",
  fontFamily: "Georgia, serif",
  fontSize: 13,
  lineHeight: 1.45,
  letterSpacing: "0.02em",
  textAlign: "center",
};

const colTitle: React.CSSProperties = {
  fontStyle: "italic",
  fontSize: 14,
  color: "rgba(233, 214, 178, 0.95)",
  marginBottom: 6,
};

export default function GlowTest() {
  const spinRef = useRef<Spin>({ rx: 0, ry: 0, vx: 0, vy: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [glowOn, setGlowOn] = useState(false); // default OFF per the owner
  const glowRef = useRef(false);
  useEffect(() => {
    glowRef.current = glowOn;
  }, [glowOn]);
  const [fixed, setFixed] = useState<{ ry: number; rx: number } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has("spin") || p.has("tilt")) {
      setFixed({
        ry: ((parseFloat(p.get("spin") ?? "0") || 0) * Math.PI) / 180,
        rx: ((parseFloat(p.get("tilt") ?? "0") || 0) * Math.PI) / 180,
      });
    }
    if (p.get("glow") === "1") setGlowOn(true);
  }, []);

  return (
    <main
      style={{ position: "fixed", inset: 0, background: "#0a0705", touchAction: "none", cursor: "grab" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        spinRef.current.vy = (e.clientX - d.x) * 0.004;
        spinRef.current.vx = (e.clientY - d.y) * 0.003;
        d.x = e.clientX;
        d.y = e.clientY;
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <Canvas camera={{ position: [0, 0, 4.8], fov: 40 }} dpr={[1, 1.75]}>
        <BookLights plain={false} />
        <Suspense fallback={null}>
          <Trio spinRef={spinRef} glowRef={glowRef} fixed={fixed} />
        </Suspense>
        <EffectComposer multisampling={2}>
          <Bloom
            intensity={BLOOM.intensity}
            luminanceThreshold={BLOOM.luminanceThreshold}
            luminanceSmoothing={BLOOM.luminanceSmoothing}
            radius={BLOOM.radius}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Apple-native-style toggle: ignition on/off */}
      <div
        style={{
          position: "fixed",
          top: "3vh",
          left: "2.5vw",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 10,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <button
          role="switch"
          aria-checked={glowOn}
          aria-label="Glow"
          onClick={() => setGlowOn((v) => !v)}
          style={{
            width: 51,
            height: 31,
            borderRadius: 16,
            border: "none",
            padding: 2,
            cursor: "pointer",
            background: glowOn ? "#34C759" : "rgba(120, 120, 128, 0.32)",
            transition: "background 0.25s",
            display: "block",
          }}
        >
          <span
            style={{
              display: "block",
              width: 27,
              height: 27,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 3px 8px rgba(0,0,0,0.35), 0 1px 1px rgba(0,0,0,0.16)",
              transform: glowOn ? "translateX(20px)" : "translateX(0)",
              transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </button>
        <span
          style={{
            color: "rgba(233, 214, 178, 0.8)",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 14,
          }}
        >
          glow
        </span>
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "3.5vh",
          textAlign: "center",
          color: "rgba(233, 214, 178, 0.75)",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.06em",
          pointerEvents: "none",
        }}
      >
        drag anywhere — both turn together
      </div>

      <div style={{ ...col, left: "4%" }}>
        <div style={colTitle}>① the object you gave us</div>
        bookNew2.glb exactly as delivered, untouched.
      </div>
      <div style={{ ...col, right: "4%" }}>
        <div style={colTitle}>③ TheBook — now the site&rsquo;s book</div>
        The exact component, glow, lights, and bloom the main site uses.
        What you see here is what the intro and the dismissed book show.
      </div>
    </main>
  );
}
