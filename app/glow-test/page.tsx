"use client";

/* TEMPORARY — /glow-test
   Three REAL 3D books, drag anywhere to turn them all together:
   ① the owner's bookNew2.glb exactly as delivered
   ② the scan-built red book from the beloved screenshots
   ③ THE RECREATION — the plum/copper design of ①, rebuilt in code
     the way ② was built: same geometry trick, but the textures are
     the original 700×1088 scans recolored offline to match the GLB's
     palette, with the ramp lockup traced from the GLB's own atlas and
     painted onto the back at full resolution.
   Apple-style toggle top-left turns the ignition on/off (default OFF).
   Delete this route once the question is settled. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BuiltBook } from "@/components/Intro3D";

const H = 1.65;
const W = H * (700 / 1088);
const D = H * (230 / 852) * 0.9;
const CT = 0.05;

type Spin = { rx: number; ry: number; vx: number; vy: number };

/* ③ the recreation: code-built book wearing the plum/copper design */
function PlumBook({ igniteRef }: { igniteRef: React.MutableRefObject<number> }) {
  const [plumF, plumB, plumS, igF, igB, igS, bumpF, bumpB, bumpS, pages, pagesRot] = useTexture([
    "/masks/plum-front.jpg",
    "/masks/plum-back.jpg",
    "/masks/plum-spine.jpg",
    "/masks/plum-ignite-front.png",
    "/masks/plum-ignite-back.png",
    "/masks/plum-ignite-spine.png",
    "/covers/front.jpeg",
    "/covers/back.jpeg",
    "/covers/spine.jpeg",
    "/masks/plum-pages.jpg", // the GLB's own page stripes (lines along u)
    "/masks/plum-pages-rot.jpg", // rotated: lines along v, for the fore-edge
  ]);
  [plumF, plumB, plumS, igF, igB, igS, pages, pagesRot].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
  });
  // the GLB tiles its page stripes denser than a single wrap — match it
  pagesRot.wrapS = pagesRot.wrapT = THREE.RepeatWrapping;
  pagesRot.repeat.set(2, 1); // fore-edge: lines vary along u (depth)
  pages.wrapS = pages.wrapT = THREE.RepeatWrapping;
  pages.repeat.set(1, 2); // top/bottom: lines vary along v (depth)

  const frontMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: plumF,
      bumpMap: bumpF,
      bumpScale: 1.6,
      roughnessMap: bumpF,
      roughness: 0.9,
      metalness: 0.25,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    m.emissiveMap = igF;
    return m;
  }, [plumF, bumpF, igF]);

  const backMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: plumB,
      bumpMap: bumpB,
      bumpScale: 1.2,
      roughness: 0.75,
      metalness: 0.15,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    m.emissiveMap = igB;
    return m;
  }, [plumB, bumpB, igB]);

  const spineMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: plumS,
      bumpMap: bumpS,
      bumpScale: 1.4,
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    m.emissiveMap = igS;
    return m;
  }, [plumS, bumpS, igS]);

  const leather = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a2630", roughness: 0.62, metalness: 0.06 }),
    []
  );
  // the GLB's own striped paper — pages are vertical sheets stacked
  // through the book's depth, so the fore-edge shows VERTICAL lines
  // (rotated copy) while top/bottom edges show lines running front-to-back
  const pageEdgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pagesRot,
        roughness: 0.65,
        metalness: 0.05,
      }),
    [pagesRot]
  );
  const pageFlatMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pages,
        roughness: 0.65,
        metalness: 0.05,
      }),
    [pages]
  );

  useFrame(() => {
    frontMat.emissiveIntensity = igniteRef.current * 0.3;
    spineMat.emissiveIntensity = igniteRef.current * 0.26;
    backMat.emissiveIntensity = igniteRef.current * 0.3;
  });

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return (
    <group>
      <mesh position={[0, 0, D / 2 - CT / 2]}>
        <boxGeometry args={[W, H, CT]} />
        {[leather, leather, leather, leather, frontMat, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      <mesh position={[0, 0, -(D / 2 - CT / 2)]}>
        <boxGeometry args={[W, H, CT]} />
        {[leather, leather, leather, leather, leather, backMat].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      <mesh position={[-W / 2, 0, 0]}>
        <boxGeometry args={[CT * 1.5, H * 1.012, D * 1.03]} />
        {[leather, spineMat, leather, leather, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[W - 0.06, H - 0.045, D - CT * 2]} />
        {[pageEdgeMat, leather, pageFlatMat, pageFlatMat, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
    </group>
  );
}

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
    const s = H / size.y;
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
  /** deterministic pose for screenshot verification (?spin=&tilt= in deg) */
  fixed: { ry: number; rx: number } | null;
}) {
  // BuiltBook/PlumBook multiply internally by ~0.3 (the "10%" era) —
  // compensate so ignition burns at the full power of the screenshots
  const igHot = useRef(0);
  const gL = useRef<THREE.Group>(null);
  const gM = useRef<THREE.Group>(null);
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
    const ig = fixed
      ? 0.85 // steady mid-burn for reproducible screenshots
      : (0.55 + 0.45 * Math.sin(t * 0.9)) * (0.9 + 0.1 * Math.sin(t * 5.1));
    igHot.current = glowRef.current ? ig * 3.3 : 0;
    [gL, gM, gR].forEach((g) => {
      if (g.current) {
        g.current.rotation.y = s.ry;
        g.current.rotation.x = s.rx;
      }
    });
  });

  // reference book temporarily hidden per the owner, for a close ①/③ read
  const SHOW_REFERENCE = false;
  return (
    <>
      <group ref={gL} position={[SHOW_REFERENCE ? -1.55 : -0.95, 0, 0]} scale={0.82}>
        <GlbBookAsDelivered />
      </group>
      {SHOW_REFERENCE && (
        <group ref={gM} position={[0, 0, 0]} scale={0.82}>
          <BuiltBook igniteRef={igHot} />
        </group>
      )}
      <group ref={gR} position={[SHOW_REFERENCE ? 1.55 : 0.95, 0, 0]} scale={0.82}>
        <PlumBook igniteRef={igHot} />
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
  const [glowOn, setGlowOn] = useState(false); // default OFF per the owner
  const glowRef = useRef(false);
  useEffect(() => {
    glowRef.current = glowOn;
  }, [glowOn]);
  // deterministic pose + glow via URL for screenshot verification
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
        <ambientLight intensity={0.42} color="#ffdcb0" />
        <pointLight position={[-2.4, 0.6, -3]} intensity={26} color="#ff8f3c" />
        <pointLight position={[-1.6, -1.4, 2.6]} intensity={16} color="#ffc890" />
        <Suspense fallback={null}>
          <Trio spinRef={spinRef} glowRef={glowRef} fixed={fixed} />
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
        drag anywhere — all three turn together
      </div>

      <div style={{ ...col, width: "44%", left: "4%" }}>
        <div style={colTitle}>① the object you gave us</div>
        bookNew2.glb exactly as delivered, untouched.
      </div>
      <div style={{ ...col, width: "44%", right: "4%" }}>
        <div style={colTitle}>③ the recreation</div>
        The same design rebuilt in code from the hi-res scans: palette
        matched to ①, ramp lockup traced from ①&rsquo;s own art, page
        edges now ①&rsquo;s actual stripes. (② is temporarily hidden
        for this comparison.)
      </div>
    </main>
  );
}
