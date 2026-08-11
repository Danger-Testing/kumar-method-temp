"use client";

/* THE BOOK — the single source of truth for the physical tome, used by
   the intro emergence (Intro3D), the dismissed state (ClosedBook), and
   the /glow-test comparison page. ONE geometry, ONE set of materials,
   ONE glow drive, ONE bloom config, ONE light rig. If a scene renders
   the book any other way, that's a bug.

   The design is the owner's plum/copper bookNew2, recreated at full
   resolution: the original 700×1088 cover scans recolored offline to the
   GLB's sampled palette, the ramp lockup transplanted from the GLB's own
   atlas, and the GLB's page stripes. Authored per the recalibration
   protocol — regenerate the /masks/plum-* set offline if the design
   ever changes. */

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

export const BOOK_H = 1.65;
export const BOOK_W = BOOK_H * (700 / 1088);
export const BOOK_D = BOOK_H * (230 / 852) * 0.9;
const CT = 0.05; // cover board thickness

/* ONE GLOW.
   igniteDrive(t) is the canonical rhythm (the approved demo look) —
   scenes with a free-running glow (ClosedBook, glow-test) feed it
   straight into TheBook's igniteRef. The intro's scripted awakening
   ramps its own 0→~1 timeline and multiplies by IGNITE_FULL so its
   peak lands on the exact same brightness. */
// 1.65 = the demo's 3.3 × the owner's dialed 0.50 (slider session,
// 2026-08-11). This is THE glow level; don't retune per scene.
export const IGNITE_FULL = 1.65;
export function igniteDrive(t: number): number {
  return (0.55 + 0.45 * Math.sin(t * 0.9)) * (0.9 + 0.1 * Math.sin(t * 5.1)) * IGNITE_FULL;
}

/* ONE BLOOM. Every composer that shows the book uses exactly this. */
export const BLOOM = {
  intensity: 0.8,
  luminanceThreshold: 0.55,
  luminanceSmoothing: 0.22,
  radius: 0.42,
} as const;

/* ONE LIGHT RIG (and its lights-off counterpart). */
export function BookLights({ plain }: { plain: boolean }) {
  return plain ? (
    // pure ambient: flat albedo, zero hotspots — the inspection mode
    <ambientLight intensity={1.35} color="#ffffff" />
  ) : (
    // no key spotlight: its raking angle dragged relief into moiré bands
    <>
      <ambientLight intensity={0.42} color="#ffdcb0" />
      <pointLight position={[-2.4, 0.6, -3]} intensity={26} color="#ff8f3c" />
      <pointLight position={[-1.6, -1.4, 2.6]} intensity={16} color="#ffc890" />
    </>
  );
}

// warm the textures the moment this module loads
useTexture.preload("/masks/plum-front.jpg");
useTexture.preload("/masks/plum-back.jpg");
useTexture.preload("/masks/plum-spine.jpg");
useTexture.preload("/masks/plum-ignite-front.png");
useTexture.preload("/masks/plum-ignite-back.png");
useTexture.preload("/masks/plum-ignite-spine.png");
useTexture.preload("/covers/front.jpeg");
useTexture.preload("/covers/back.jpeg");
useTexture.preload("/covers/spine.jpeg");
useTexture.preload("/masks/plum-pages.jpg");
useTexture.preload("/masks/plum-pages-rot.jpg");

export function TheBook({
  igniteRef,
  shadeRef,
  plain = false,
}: {
  /** glow level in canonical units — igniteDrive(t), or timeline × IGNITE_FULL */
  igniteRef: React.MutableRefObject<number>;
  /** cave-shadow multiply for the emergence (1 = fully lit) */
  shadeRef?: React.MutableRefObject<number>;
  /** inspection mode: no glow, no relief */
  plain?: boolean;
}) {
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
    "/masks/plum-pages.jpg",
    "/masks/plum-pages-rot.jpg",
  ]);
  [plumF, plumB, plumS, igF, igB, igS, pages, pagesRot].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
  });
  // the page stripes tile denser than a single wrap; wrap mode is
  // sampler state, so it needs the re-upload flag
  pagesRot.wrapS = pagesRot.wrapT = THREE.RepeatWrapping;
  pagesRot.repeat.set(2, 1); // fore-edge: lines vary along u (depth)
  pagesRot.needsUpdate = true;
  pages.wrapS = pages.wrapT = THREE.RepeatWrapping;
  pages.repeat.set(1, 2); // top/bottom: lines vary along v (depth)
  pages.needsUpdate = true;

  const frontMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: plumF,
      bumpMap: bumpF,
      bumpScale: 1.6,
      // NO roughnessMap: the scan-as-roughness made dark leather glossy,
      // so the point lights glinted off the embossing at grazing angles
      // ("sparkle reflections"). Real leather is matte.
      roughness: 0.8,
      metalness: 0.12,
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
  const pageEdgeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pagesRot, roughness: 0.65, metalness: 0.05 }),
    [pagesRot]
  );
  const pageFlatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pages, roughness: 0.65, metalness: 0.05 }),
    [pages]
  );

  useFrame(() => {
    const ig = plain ? 0 : igniteRef.current;
    frontMat.emissiveIntensity = ig * 0.3;
    spineMat.emissiveIntensity = ig * 0.26;
    backMat.emissiveIntensity = ig * 0.3;
    // relief off in inspection mode (bumpScale is a uniform — cheap)
    const bump = plain ? 0 : 1;
    frontMat.bumpScale = 1.6 * bump;
    backMat.bumpScale = 1.2 * bump;
    spineMat.bumpScale = 1.4 * bump;
    // the emergence's cave shadow: multiply every material's color
    const shade = shadeRef?.current ?? 1;
    [frontMat, backMat, spineMat, leather, pageEdgeMat, pageFlatMat].forEach((m) => {
      if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
      m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(shade);
    });
  });

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return (
    <group>
      {/* front cover */}
      <mesh position={[0, 0, BOOK_D / 2 - CT / 2]}>
        <boxGeometry args={[BOOK_W, BOOK_H, CT]} />
        {[leather, leather, leather, leather, frontMat, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* back cover */}
      <mesh position={[0, 0, -(BOOK_D / 2 - CT / 2)]}>
        <boxGeometry args={[BOOK_W, BOOK_H, CT]} />
        {[leather, leather, leather, leather, leather, backMat].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* spine hub, slightly proud like a real binding */}
      <mesh position={[-BOOK_W / 2, 0, 0]}>
        <boxGeometry args={[CT * 1.5, BOOK_H * 1.012, BOOK_D * 1.03]} />
        {[leather, spineMat, leather, leather, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
      {/* page block */}
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[BOOK_W - 0.06, BOOK_H - 0.045, BOOK_D - CT * 2]} />
        {[pageEdgeMat, leather, pageFlatMat, pageFlatMat, leather, leather].map((m, i) => (
          <primitive key={i} object={m} attach={`material-${i}`} />
        ))}
      </mesh>
    </group>
  );
}
