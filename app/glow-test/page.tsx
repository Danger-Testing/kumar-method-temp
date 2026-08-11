"use client";

/* TEMPORARY — /glow-test
   Proof for the owner before asking the 3D artist for a hi-res export:
   the SAME art (the original 700×1088 front-cover scan), the SAME
   ignition machinery (gold-mask emissive + bloom), rendered twice.
   Left: the art downsampled to the current book's effective texel
   density (the 1024 atlas gives the cover ~505px of height).
   Right: the full-resolution scan — what a hi-res export would give.
   The ONLY variable is texture resolution. Delete this route once the
   question is settled. */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

type PanelAssets = { color: THREE.CanvasTexture; mask: THREE.CanvasTexture };

function buildAssets(img: HTMLImageElement, height: number): PanelAssets {
  const w = Math.round((img.width / img.height) * height);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, height);
  const src = ctx.getImageData(0, 0, w, height);
  const m = document.createElement("canvas");
  m.width = w;
  m.height = height;
  const mctx = m.getContext("2d")!;
  const out = mctx.createImageData(w, height);
  for (let i = 0; i < src.data.length; i += 4) {
    const r = src.data[i];
    const g = src.data[i + 1];
    const b = src.data[i + 2];
    // the scan book's gold rule, verbatim from the original pipeline
    const gold = r > 128 && g > 84 && g > r * 0.5 && b < g * 0.92 && r + g > 236;
    const v = gold ? 255 : 0;
    out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
    out.data[i + 3] = 255;
  }
  mctx.putImageData(out, 0, 0);
  mctx.filter = "blur(1.2px)"; // same feather as the real pipeline
  mctx.drawImage(m, 0, 0);
  const color = new THREE.CanvasTexture(c);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = 16;
  const mask = new THREE.CanvasTexture(m);
  mask.colorSpace = THREE.SRGBColorSpace;
  mask.anisotropy = 16;
  return { color, mask };
}

function GlowPanel({ assets, x }: { assets: PanelAssets; x: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // full-power ignition rhythm: build, breathe, hold
    const ig = (0.55 + 0.45 * Math.sin(t * 0.9)) * (0.9 + 0.1 * Math.sin(t * 5.1));
    if (mat.current) mat.current.emissiveIntensity = ig * 2.6;
  });
  const aspect = 700 / 1088;
  const h = 2.4;
  return (
    <mesh position={[x, 0, 0]}>
      <planeGeometry args={[h * aspect, h]} />
      <meshStandardMaterial
        ref={mat}
        map={assets.color}
        emissive="#ffb763"
        emissiveMap={assets.mask}
        roughness={0.85}
        metalness={0.15}
      />
    </mesh>
  );
}

const caption: React.CSSProperties = {
  position: "fixed",
  bottom: "5vh",
  width: "50%",
  textAlign: "center",
  color: "rgba(233, 214, 178, 0.6)",
  fontFamily: "Georgia, serif",
  fontStyle: "italic",
  fontSize: 14,
  letterSpacing: "0.06em",
};

export default function GlowTest() {
  const [assets, setAssets] = useState<{ lo: PanelAssets; hi: PanelAssets } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/covers/front.jpeg";
    img.onload = () => {
      setAssets({
        lo: buildAssets(img, 505), // the GLB atlas's effective cover height
        hi: buildAssets(img, 1088), // the full scan — a hi-res export
      });
    };
  }, []);

  return (
    <main style={{ position: "fixed", inset: 0, background: "#0a0705" }}>
      {assets && (
        <Canvas camera={{ position: [0, 0, 4], fov: 40 }} dpr={[1, 2]}>
          <ambientLight intensity={0.4} color="#ffdcb0" />
          <pointLight position={[-1.6, -1.4, 2.6]} intensity={14} color="#ffc890" />
          <GlowPanel assets={assets.lo} x={-0.88} />
          <GlowPanel assets={assets.hi} x={0.88} />
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
      )}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "4vh",
          textAlign: "center",
          color: "rgba(233, 214, 178, 0.75)",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.06em",
        }}
      >
        the same art, the same glow — only the texture resolution differs
      </div>
      <div style={{ ...caption, left: 0 }}>1024 atlas</div>
      <div style={{ ...caption, right: 0 }}>hi-res texture</div>
    </main>
  );
}
