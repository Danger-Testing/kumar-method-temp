"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* Book proportions measured from the cover scans:
   front 700×1088, spine 230×852 → a thick, squat tome. */
const H = 1.65;
const W = H * (700 / 1088);
const D = H * (230 / 852) * 0.9;
const CT = 0.05; // cover board thickness

const TOTAL = 5.3; // seconds

// start fetching the cover scans the moment this module loads
useTexture.preload("/covers/front.jpeg");
useTexture.preload("/covers/back.jpeg");
useTexture.preload("/covers/spine.jpeg");
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeInExpo = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/* ------------------------------------------------------------------ */
/*  Gold-mask: pull the gilded emblems out of the cover scan so only   */
/*  they ignite and bloom                                              */
/* ------------------------------------------------------------------ */

function useGoldMask(src: string): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const w = 512;
      const h = Math.round((img.height / img.width) * w);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        // gilding reads warm and bright; leather reads red and dark-green-channel.
        // threshold kept strict so stray bright leather pixels don't speckle.
        const gold = r > 128 && g > 84 && g > r * 0.5 && b < g * 0.92 && r + g > 236;
        const v = gold ? 255 : 0;
        px[i] = v;
        px[i + 1] = v;
        px[i + 2] = v;
      }
      ctx.putImageData(data, 0, 0);
      // soften the mask so the glow feathers
      ctx.filter = "blur(1.2px)";
      ctx.drawImage(canvas, 0, 0);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
    };
  }, [src]);
  return tex;
}

/* gilded page-block edges */
function makePageEdgeTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#b3924f";
  ctx.fillRect(0, 0, 64, 512);
  for (let y = 0; y < 512; y += 2) {
    const shade = 150 + ((y * 37) % 70);
    ctx.fillStyle = `rgba(${shade}, ${Math.round(shade * 0.78)}, ${Math.round(shade * 0.42)}, 0.55)`;
    ctx.fillRect(0, y, 64, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/*  The tome, built from the real cover scans                          */
/* ------------------------------------------------------------------ */

function BuiltBook({ igniteRef }: { igniteRef: React.MutableRefObject<number> }) {
  const [front, back, spine] = useTexture([
    "/covers/front.jpeg",
    "/covers/back.jpeg",
    "/covers/spine.jpeg",
  ]);
  const goldMask = useGoldMask("/covers/front.jpeg");
  const spineMask = useGoldMask("/covers/spine.jpeg");
  const pageEdge = useMemo(makePageEdgeTexture, []);

  [front, back, spine].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });

  const frontMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: front,
      bumpMap: front,
      bumpScale: 1.6,
      roughnessMap: front,
      roughness: 0.9,
      metalness: 0.25,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    if (goldMask) m.emissiveMap = goldMask;
    return m;
  }, [front, goldMask]);

  const backMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: back,
        bumpMap: back,
        bumpScale: 1.2,
        roughness: 0.75,
        metalness: 0.15,
      }),
    [back]
  );

  const spineMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: spine,
      bumpMap: spine,
      bumpScale: 1.4,
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    if (spineMask) m.emissiveMap = spineMask;
    return m;
  }, [spine, spineMask]);

  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#671410", roughness: 0.62, metalness: 0.06 }),
    []
  );

  const pageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pageEdge,
        color: "#d8b878",
        roughness: 0.38,
        metalness: 0.55,
      }),
    [pageEdge]
  );

  useFrame(() => {
    frontMat.emissiveIntensity = igniteRef.current * 0.3;
    spineMat.emissiveIntensity = igniteRef.current * 0.26;
  });

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return (
    <group>
      {/* front cover */}
      <mesh position={[0, 0, D / 2 - CT / 2]}>
        <boxGeometry args={[W, H, CT]} />
        {[leather, leather, leather, leather, frontMat, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* back cover */}
      <mesh position={[0, 0, -(D / 2 - CT / 2)]}>
        <boxGeometry args={[W, H, CT]} />
        {[leather, leather, leather, leather, leather, backMat].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* spine hub, slightly proud like a real binding */}
      <mesh position={[-W / 2, 0, 0]}>
        <boxGeometry args={[CT * 1.5, H * 1.012, D * 1.03]} />
        {[leather, spineMat, leather, leather, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* gilded page block */}
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[W - 0.06, H - 0.045, D - CT * 2]} />
        {[pageMat, leather, pageMat, pageMat, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
    </group>
  );
}

/* optional: drop a generated mesh at public/book.glb and it replaces the
   built one automatically */
function GlbBook() {
  const { scene } = useGLTF("/book.glb");
  const normalized = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const s = H / size.y;
    scene.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    scene.position.sub(center);
    return scene;
  }, [scene]);
  return <primitive object={normalized} />;
}

/* ------------------------------------------------------------------ */
/*  Timeline: spin in → gilding ignites → hard dolly into the cover    */
/* ------------------------------------------------------------------ */

function IntroScene({
  useGlb,
  onFade,
  onDive,
  onDone,
}: {
  useGlb: boolean;
  onFade: (v: number) => void;
  onDive: (v: number) => void;
  onDone: (finished: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const igniteRef = useRef(0);
  const bloomRef = useRef<{ intensity: number } | null>(null);
  const doneRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    // the timeline starts on the first *rendered* frame, so slow texture
    // loads on mobile don't swallow the opening beats of the spin
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const t = clock.getElapsedTime() - startRef.current;
    const g = group.current;
    if (!g) return;

    // grand spin settling to face us
    const spin = easeOutQuart(Math.min(1, t / 3.3));
    g.rotation.y = (1 - spin) * Math.PI * 2.7;
    g.rotation.x = -0.06 + Math.sin(t * 1.1) * 0.012;
    g.position.y = Math.sin(t * 1.3) * 0.03;
    const s = 0.84 + easeOutQuart(Math.min(1, t / 3)) * 0.16;
    g.scale.setScalar(s);

    // the dolly: no let-up — it accelerates until the cover kisses the lens
    const d = easeInExpo(smooth(3.85, 5.05, t));

    // the gilding ignites, then overbrightens as we close in
    const ig = smooth(2.5, 3.5, t);
    igniteRef.current = ig * (0.85 + Math.sin(t * 5.2) * 0.15) * (1 + d * 0.8);
    // a candle-glint on the gold, nothing more
    if (bloomRef.current) bloomRef.current.intensity = 0.12 + ig * 0.08 + d * 0.9;

    // stop the magnification before the scan runs out of pixels — the
    // rack-focus blur and grain carry the final stretch instead
    camera.position.z = 4.15 - d * 3.72;
    camera.position.y = 0.06 * d;
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 40 + d * 15;
    cam.updateProjectionMatrix();
    camera.lookAt(0, 0.06 * d, 0);
    camera.rotation.z += d * 0.05;

    // the cover rushes past the focal plane: blur + grain ramp with the dive
    onDive(d);

    // the last beats dissolve into golden light, not black
    onFade(smooth(4.82, 5.18, t));

    if (t >= TOTAL && !doneRef.current) {
      doneRef.current = true;
      onDone(true);
    }
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#ffdcb0" />
      <spotLight position={[2.4, 2.6, 3.4]} intensity={38} angle={0.7} penumbra={0.6} color="#ffd9a2" />
      <pointLight position={[-2.4, 0.6, -3]} intensity={26} color="#ff8f3c" />
      <pointLight position={[-1.6, -1.4, 2.6]} intensity={6} color="#ffc890" />
      <group ref={group}>{useGlb ? <GlbBook /> : <BuiltBook igniteRef={igniteRef} />}</group>

      <EffectComposer multisampling={isCoarse() ? 0 : 4}>
        <Bloom
          ref={bloomRef as never}
          intensity={0.12}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.22}
          radius={0.42}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

/* ------------------------------------------------------------------ */

/** coarse pointer ≈ phone/tablet: render leaner there */
function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export default function Intro3D({ onDone }: { onDone: (finished: boolean) => void }) {
  const [glb, setGlb] = useState(false);
  const fadeRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/book.glb", { method: "HEAD" })
      .then((r) => setGlb(r.ok && (r.headers.get("content-type") ?? "").includes("model")))
      .catch(() => setGlb(false));
  }, []);

  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") onDone(false);
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  return (
    <div className="introRoot" onClick={() => onDone(false)}>
      <div className="introCanvas" ref={canvasWrapRef}>
        <Canvas
          camera={{ position: [0, 0, 4.15], fov: 40 }}
          gl={{ antialias: !isCoarse() }}
          dpr={isCoarse() ? [1, 1.5] : [1, 2]}
        >
          <IntroScene
            useGlb={glb}
            onFade={(v) => {
              if (fadeRef.current) fadeRef.current.style.opacity = String(v);
            }}
            onDive={(d) => {
              // rack focus: the world slides past the focal plane late in the dive
              const blur = Math.max(0, (d - 0.45) / 0.55) * (isCoarse() ? 10 : 16);
              if (canvasWrapRef.current) {
                canvasWrapRef.current.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "";
              }
              if (grainRef.current) grainRef.current.style.opacity = String(d * 0.34);
            }}
            onDone={onDone}
          />
        </Canvas>
      </div>
      <div className="introGrain" ref={grainRef} aria-hidden="true" />
      <div className="introFade" ref={fadeRef} aria-hidden="true">
        <div className="rampLogo" aria-label="ramp" />
      </div>
      <div className="skipHint">tap to skip</div>
    </div>
  );
}
