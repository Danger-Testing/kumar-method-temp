"use client";

/* TEMPORARY — /glow-test
   Three REAL 3D books, drag anywhere to turn them all together:
   ① the owner's bookNew2.glb glowing through today's 1024 stencil
   ② the scan-built book from the beloved screenshots (700×1088 art)
   ③ the owner's GLB again with the stencil re-drawn at 4096 — the
     proposed fix that needs nothing from the 3D artist.
   Delete this route once the question is settled. */

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BuiltBook } from "@/components/Intro3D";

const H = 1.65;

type Spin = { rx: number; ry: number; vx: number; vy: number };

function GlbGlowBook({
  maskUrl,
  igRef,
}: {
  maskUrl: string;
  igRef: React.MutableRefObject<number>;
}) {
  const { scene } = useGLTF("/book.glb");

  const { root, mats } = useMemo(() => {
    // clone hierarchy AND materials so the two GLB panels stay independent
    const clone = scene.clone(true);
    const mats: THREE.MeshStandardMaterial[] = [];
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material;
      const arr = Array.isArray(src) ? src : [src];
      const cloned = arr.map((m) => {
        const c = (m as THREE.MeshStandardMaterial).clone();
        c.normalScale?.multiplyScalar(0.05); // match the site's taming
        if (c.name === "Book_Outer") mats.push(c);
        return c;
      });
      mesh.material = Array.isArray(src) ? cloned : cloned[0];
    });
    // normalize exactly like the site: pitch upright, scale to H, center
    const root = new THREE.Group();
    const pre = new THREE.Box3().setFromObject(clone);
    const preSize = pre.getSize(new THREE.Vector3());
    if (preSize.z >= preSize.x && preSize.z >= preSize.y) {
      clone.rotation.x = -Math.PI / 2;
    }
    root.add(clone);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s = H / size.y;
    root.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    root.position.sub(center);
    return { root, mats };
  }, [scene]);

  useEffect(() => {
    const t = new THREE.TextureLoader().load(maskUrl);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    mats.forEach((m) => {
      m.emissive = new THREE.Color("#ffb763");
      m.emissiveMap = t;
      m.emissiveIntensity = 0;
      m.needsUpdate = true;
    });
  }, [mats, maskUrl]);

  useFrame(() => {
    for (const m of mats) m.emissiveIntensity = igRef.current * 2.8;
  });

  return <primitive object={root} />;
}

function Trio({ spinRef }: { spinRef: React.MutableRefObject<Spin> }) {
  const igRef = useRef(0);
  // BuiltBook multiplies its ignite by 0.3 internally (the "10%" taste
  // era) — compensate so it burns at the full power of the screenshots
  const igHot = useRef(0);
  const gL = useRef<THREE.Group>(null);
  const gM = useRef<THREE.Group>(null);
  const gR = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = spinRef.current;
    s.ry += s.vy;
    s.rx += s.vx;
    s.vx *= 0.94;
    s.vy *= 0.94;
    s.ry += 0.0012;
    s.rx = Math.max(-0.9, Math.min(0.9, s.rx));
    const ig = (0.55 + 0.45 * Math.sin(t * 0.9)) * (0.9 + 0.1 * Math.sin(t * 5.1));
    igRef.current = ig;
    igHot.current = ig * 3.3;
    [gL, gM, gR].forEach((g) => {
      if (g.current) {
        g.current.rotation.y = s.ry;
        g.current.rotation.x = s.rx;
      }
    });
  });

  return (
    <>
      <group ref={gL} position={[-1.55, 0, 0]} scale={0.82}>
        <GlbGlowBook maskUrl="/masks/gilding-ignite-test.png" igRef={igRef} />
      </group>
      <group ref={gM} position={[0, 0, 0]} scale={0.82}>
        <BuiltBook igniteRef={igHot} />
      </group>
      <group ref={gR} position={[1.55, 0, 0]} scale={0.82}>
        <GlbGlowBook maskUrl="/masks/gilding-ignite-4k-test.png" igRef={igRef} />
      </group>
    </>
  );
}

const col: React.CSSProperties = {
  position: "fixed",
  bottom: "3vh",
  width: "31%",
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
        <ambientLight intensity={0.42} color="#ffdcb0" />
        <pointLight position={[-2.4, 0.6, -3]} intensity={26} color="#ff8f3c" />
        <pointLight position={[-1.6, -1.4, 2.6]} intensity={16} color="#ffc890" />
        <Suspense fallback={null}>
          <Trio spinRef={spinRef} />
        </Suspense>
        <EffectComposer multisampling={2}>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.22}
            radius={0.42}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

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
        drag anywhere — all three turn together, glowing through the same pipeline
      </div>

      <div style={{ ...col, left: "1.5%" }}>
        <div style={colTitle}>① the object you gave us</div>
        bookNew2.glb exactly as delivered, glowing through today&rsquo;s
        1024-pixel stencil. This is the blur you&rsquo;ve been rejecting —
        the glow edges can&rsquo;t be sharper than the texture they&rsquo;re
        traced from.
      </div>
      <div style={{ ...col, left: "34.5%" }}>
        <div style={colTitle}>② the object we built in code</div>
        The old red book from your screenshots: no 3D file — geometry built
        in code, covers mapped from your 700×1088 scans, glow traced at
        that full resolution. The look you love, shown for reference.
      </div>
      <div style={{ ...col, right: "1.5%" }}>
        <div style={colTitle}>③ the new thing (the proposed fix)</div>
        Your book again — same mesh, same 1024 cover art — but the glow
        stencil re-drawn at 4096: the gilding&rsquo;s shapes upscaled and
        their edges re-crisped into clean curves, so the light&rsquo;s
        boundary is sharp even though the art under it isn&rsquo;t. Needs
        nothing from your 3D artist.
      </div>
    </main>
  );
}
