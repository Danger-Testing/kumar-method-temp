"use client";

/* THE BOOK — the single source of truth for the physical tome, used by
   the intro emergence (Intro3D) and the dismissed state (ClosedBook).
   ONE geometry, ONE set of materials, ONE light rig.

   CURRENT STATE (owner call, 2026-08-11 afternoon): the 3D artist's own
   bookNew2.glb, rendered with ALL effects OFF — no glow, no ignition,
   no bloom. Room light and the emergence's cave-shade only. The
   code-built recreation era lives in git history and in
   experiments/glow-test-page.tsx if it's ever wanted back. */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export const BOOK_H = 1.65;
export const BOOK_W = BOOK_H * (700 / 1088);
export const BOOK_D = BOOK_H * (230 / 852) * 0.9;

/* Glow is OFF (owner call). The drive/constants remain so callers keep
   compiling — they feed a value the materials no longer consume. */
export const IGNITE_FULL = 1.65;
export function igniteDrive(t: number): number {
  return (0.55 + 0.45 * Math.sin(t * 0.9)) * (0.9 + 0.1 * Math.sin(t * 5.1)) * IGNITE_FULL;
}

/* ONE BLOOM config — intensity 0: the pass idles (no glow, no smear). */
export const BLOOM = {
  intensity: 0,
  luminanceThreshold: 0.55,
  luminanceSmoothing: 0.22,
  radius: 0.42,
} as const;

/* ONE LIGHT RIG (and its lights-off counterpart).
   The safe rig, per the owner + artist (2026-08-11): a single soft
   directional key on the camera axis — near-normal incidence excites
   no grazing highlights, so bump moiré and specular sparkle cannot
   occur — plus neutral ambient so the spine reads during the spin.
   Near-white color keeps the artist's palette true. Raking-angle
   points and warm tints are what caused every artifact; do not
   reintroduce them. */
export function BookLights({ plain, sweep = false }: { plain: boolean; sweep?: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const start = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const light = key.current;
    if (!light) return;
    if (start.current === null) start.current = clock.getElapsedTime();
    const tm = clock.getElapsedTime() - start.current;
    // the flashlight pans up and down FOREVER — a slow lighthouse pass
    // over the book, floor to cover and back, ~4.5s per cycle
    // (sweep=false — e.g. the closed-book view — holds full aim)
    const aim = sweep
      ? tm < 1.5
        ? 0
        : (1 - Math.cos(((tm - 1.5) * Math.PI * 2) / 4.5)) / 2
      : 1;
    target.position.set(0, -4.2 * (1 - aim), 0);
    light.target = target;
    // softer at full aim — the center hotspot was too harsh
    light.intensity = 0.25 + 1.0 * aim;
  });

  return plain ? (
    <ambientLight intensity={1.35} color="#ffffff" />
  ) : (
    <>
      {/* dim gold candlelight; the key's on-axis END angle stays sacred —
          only its aim animates, floor → cover */}
      <ambientLight intensity={0.52} color="#f6e3bd" />
      <directionalLight ref={key} position={[0, 0.5, 5]} intensity={1.7} color="#ffd98f" />
      <primitive object={target} />
    </>
  );
}

useGLTF.preload("/book.glb");

export function TheBook({
  igniteRef,
  shadeRef,
  plain = false,
}: {
  /** accepted for API stability; the materials no longer consume it */
  igniteRef?: React.MutableRefObject<number>;
  /** cave-shadow multiply for the emergence (1 = fully lit) */
  shadeRef?: React.MutableRefObject<number>;
  /** inspection mode (dormant, no UI) */
  plain?: boolean;
}) {
  void igniteRef;
  const { scene } = useGLTF("/book.glb");

  const { root, mats } = useMemo(() => {
    // clone hierarchy AND materials: each mount owns its state, so the
    // emergence's shade can never leak into another scene
    const clone = scene.clone(true);
    const mats: THREE.MeshStandardMaterial[] = [];
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material;
      const arr = Array.isArray(src) ? src : [src];
      const cloned = arr.map((m) => {
        const c = (m as THREE.MeshStandardMaterial).clone();
        if (c.isMeshStandardMaterial) {
          // moiré taming: the asset's normal map is denser than any
          // screen — run it at 5% (established owner-approved level)
          c.normalScale?.multiplyScalar(0.05);
          [c.map, c.normalMap, c.roughnessMap, c.metalnessMap].forEach((t) => {
            if (t) t.anisotropy = 16;
          });
          mats.push(c);
        }
        return c;
      });
      mesh.material = Array.isArray(src) ? cloned : cloned[0];
    });
    // normalize: the asset lies flat (y = thickness, z = height) —
    // pitch upright, scale to BOOK_H, center
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
    return { root, mats };
  }, [scene]);

  useFrame(() => {
    // the emergence's cave shadow — the only per-frame material write left
    const shade = shadeRef?.current ?? 1;
    for (const m of mats) {
      if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
      m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(shade);
      if (m.normalScale) {
        // plain/inspection: relief off (dormant path, no UI)
        const k = plain ? 0 : 1;
        if (m.userData.baseNormal === undefined) m.userData.baseNormal = m.normalScale.x;
        m.normalScale.setScalar((m.userData.baseNormal as number) * k);
      }
    }
  });

  return <primitive object={root} />;
}
