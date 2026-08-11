"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import { TheBook, BookLights, IGNITE_FULL } from "@/components/TheBook";

/* Book proportions measured from the cover scans:
   front 700×1088, spine 230×852 → a thick, squat tome. */
const H = 1.65;
const W = H * (700 / 1088);
const D = H * (230 / 852) * 0.9;
const CT = 0.05; // cover board thickness

const TOTAL = 5.3; // seconds

/** the tomb doorway's screen rect, as viewport fractions (measured by
    Experience off .km-tomb-frame + the clip-path polygon in kumar.css) */
export type HoleRect = { cx: number; cy: number; w: number; h: number };

// texture warmup lives in TheBook's module scope — one source of truth
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeInExpo = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/* ------------------------------------------------------------------ */
/*  Gold-mask: pull the gilded emblems out of a texture so only they   */
/*  ignite and bloom. Two rules, tuned against the real art:           */
/*  1. strict yellow-ness (green near red, blue well below green) —    */
/*     pinkish worn-leather highlights never pass                      */
/*  2. cluster density — a gold pixel only survives if its             */
/*     neighborhood is also gold, killing lone glints on the leather   */
/* ------------------------------------------------------------------ */

function buildGoldMask(
  img: CanvasImageSource & { width: number; height: number }
): HTMLCanvasElement | null {
  const w = Math.min(1024, img.width);
  const h = Math.round((img.height / img.width) * w);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const source = ctx.getImageData(0, 0, w, h);
  const src = source.data;
  const data = ctx.createImageData(w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    // tuned for the copper gilding on the plum book (bookNew2): warmth
    // (r well above b) is the law — the leather's grey sheen fails it.
    // Verified against the actual atlas: title, flourishes, borders and
    // ramp logos catch; leather field stays clean.
    const gold = r > 100 && r - b > 24 && g > r * 0.42 && b < g * 1.1 && r + g > 150;
    const v = gold ? 255 : 0;
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);

  // density pass: blur a copy, keep only clustered gold for the gilding
  const dcan = document.createElement("canvas");
  dcan.width = w;
  dcan.height = h;
  const dctx = dcan.getContext("2d");
  if (!dctx) return null;
  dctx.filter = `blur(${Math.max(3, w / 205)}px)`;
  dctx.drawImage(canvas, 0, 0);
  const dens = dctx.getImageData(0, 0, w, h).data;
  const m = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < m.data.length; i += 4) {
    if (m.data[i] > 0 && dens[i] <= 70) {
      m.data[i] = 0;
      m.data[i + 1] = 0;
      m.data[i + 2] = 0;
    }
  }
  ctx.putImageData(m, 0, 0);

  // the stars piercing through the book: the brightest natural glint in
  // each patch of leather becomes a small soft point of light embedded
  // in the cover — spread across the whole face, not ranked toward the
  // bright borders (mask preview verified against the real atlas)
  const CELL = Math.max(28, Math.round(w / 26));
  const cols = Math.ceil(w / CELL);
  const best = new Map<number, { x: number; y: number; heat: number }>();
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (dens[i] > 60) continue; // real gilding — already glows
      const r = src[i];
      const g = src[i + 1];
      const b = src[i + 2];
      const heat = r + g;
      // warm glints only — the plum leather's grey sheen fails r-b
      if (heat < 150 || r < 100 || r - b < 22) continue;
      const key = Math.floor(y / CELL) * cols + Math.floor(x / CELL);
      const prev = best.get(key);
      if (!prev || heat > prev.heat) best.set(key, { x, y, heat });
    }
  }
  const stars = [...best.values()]
    .sort(
      (a, b) =>
        ((a.x * 2654435761 + a.y * 40503) % 65536) - ((b.x * 2654435761 + b.y * 40503) % 65536)
    )
    .slice(0, 150);
  stars.forEach((s, i) => {
    const rad = (1.1 + ((s.x * 7 + s.y * 13 + i) % 10) * 0.2) * 2.2;
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.65)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
    ctx.fill();
  });

  // soften so the glow feathers
  ctx.filter = "blur(1.2px)";
  ctx.drawImage(canvas, 0, 0);
  return canvas;
}

function useGoldMask(src: string): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = buildGoldMask(img);
      if (!canvas) return;
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      // mipmapped + anisotropic, or the mask aliases into moiré when small
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.anisotropy = 16;
      setTex(t);
    };
  }, [src]);
  return tex;
}

/* deep-wine recolor of a cover scan: every non-gold pixel shifts toward
   dark burgundy; the gilding is detected and left warm */
function useWineTint(src: string): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const w = 1024;
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
        const gold = r > 128 && g > 84 && g > r * 0.5 && b < g * 0.92 && r + g > 236;
        if (!gold) {
          px[i] = Math.min(255, r * 0.66);
          px[i + 1] = Math.min(255, g * 0.52);
          px[i + 2] = Math.min(255, b * 1.45 + 12);
        }
      }
      ctx.putImageData(data, 0, 0);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 16;
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

export function BuiltBook({
  igniteRef,
  shadeRef,
  plain = false,
}: {
  igniteRef: React.MutableRefObject<number>;
  /** 0..1 darkness multiplier — the book in the cave's shadow */
  shadeRef?: React.MutableRefObject<number>;
  /** inspection mode: strip surface relief */
  plain?: boolean;
}) {
  const [front, back, spine] = useTexture([
    "/covers/front.jpeg",
    "/covers/back.jpeg",
    "/covers/spine.jpeg",
  ]);
  const goldMask = useGoldMask("/covers/front.jpeg");
  const spineMask = useGoldMask("/covers/spine.jpeg");
  const wineFront = useWineTint("/covers/front.jpeg");
  const wineBack = useWineTint("/covers/back.jpeg");
  const wineSpine = useWineTint("/covers/spine.jpeg");
  const pageEdge = useMemo(makePageEdgeTexture, []);

  [front, back, spine].forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
  });

  const frontMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: wineFront ?? front,
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
  }, [front, goldMask, wineFront]);

  const backMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wineBack ?? back,
        bumpMap: back,
        bumpScale: 1.2,
        roughness: 0.75,
        metalness: 0.15,
      }),
    [back, wineBack]
  );

  const spineMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: wineSpine ?? spine,
      bumpMap: spine,
      bumpScale: 1.4,
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color("#ffb763"),
      emissiveIntensity: 0,
    });
    if (spineMask) m.emissiveMap = spineMask;
    return m;
  }, [spine, spineMask, wineSpine]);

  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#43101d", roughness: 0.62, metalness: 0.06 }),
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
    const shade = shadeRef?.current ?? 1;
    for (const m of [frontMat, backMat, spineMat, leather, pageMat]) {
      if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
      m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(shade);
      if (m.userData.baseBump === undefined) m.userData.baseBump = m.bumpScale;
      m.bumpScale = plain ? 0 : (m.userData.baseBump as number);
    }
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

/* optional: drop a mesh at public/book.glb and it replaces the built one
   automatically */
export function GlbBook({
  igniteRef,
  shadeRef,
  plain = false,
}: {
  igniteRef: React.MutableRefObject<number>;
  /** 0..1 darkness multiplier — the book in the cave's shadow */
  shadeRef?: React.MutableRefObject<number>;
  /** inspection mode: strip surface relief */
  plain?: boolean;
}) {
  const { scene } = useGLTF("/book.glb");

  // give the GLB the same gilding ignition as the built book: derive a
  // gold mask from each material's own texture, so it lands exactly on
  // the emblems via the mesh's existing UVs
  const mats = useMemo(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material;
      (Array.isArray(m) ? m : [m]).forEach((mm) => {
        if ((mm as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          list.push(mm as THREE.MeshStandardMaterial);
        }
      });
    });
    return list;
  }, [scene]);

  useEffect(() => {
    // THE LANTERN CUT (owner-directed): no emissive, no shine — the ramp
    // mark is physically CUT OUT of the back cover (alphaTest against the
    // authored stencil, inverted: black = hole) and an unlit warm plane
    // inside the book shows through the letterforms. The edge is an
    // occlusion boundary, not a light effect — brightness cannot blur it.
    // Both atlas back-panels carry the mark, so outer and inner cover
    // faces open into a true through-hole.
    const cut = new THREE.TextureLoader().load("/masks/ramp-cutout-alpha.png");
    cut.flipY = false; // glTF UV convention — must match the atlas
    cut.anisotropy = 16; // alpha data stays linear — no SRGB here
    mats.forEach((m) => {
      // sharper sampling at glancing angles on the asset's own maps —
      // these are already on the GPU, so the sampler must be re-uploaded
      [m.map, m.normalMap, m.roughnessMap, m.metalnessMap].forEach((tex) => {
        if (tex) {
          tex.anisotropy = 16;
          tex.needsUpdate = true;
        }
      });
      if (m.name !== "Book_Outer") return; // only the covers are cut
      m.alphaMap = cut;
      m.alphaTest = 0.5; // binary cut at the stencil's anti-aliased midline
      m.needsUpdate = true;
    });
  }, [mats]);

  useFrame(() => {
    // the GLB's clean art can take the full-power ignition without the
    // speckling that forced the scan-based book down to 10%
    const shade = shadeRef?.current ?? 1;
    for (const m of mats) {
      if (m.emissiveMap) m.emissiveIntensity = igniteRef.current * 2.8;
      if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
      m.color.copy(m.userData.baseColor as THREE.Color).multiplyScalar(shade);
      // inspection mode strips surface relief (moiré source)
      if (m.userData.baseBump === undefined) m.userData.baseBump = m.bumpScale;
      // moiré taming: the GLB's normal map is far denser than the screen
      // can resolve, so its authoritative base strength is 60% of the
      // asset's — stashed once, so cache-shared materials never compound
      if (!m.userData.baseNormal && m.normalScale) {
        // 0.05 = owner's call (2026-08-11): relief at a whisper — the
        // asset's normal map is the moiré engine, so it barely registers
        m.userData.baseNormal = m.normalScale.clone().multiplyScalar(0.05);
      }
      m.bumpScale = plain ? 0 : (m.userData.baseBump as number);
      if (m.userData.baseNormal) {
        m.normalScale.copy(m.userData.baseNormal as THREE.Vector2);
        if (plain) m.normalScale.set(0, 0);
      }
    }
  });

  // the GLTF scene is cache-shared (ClosedBook renders the same materials
  // later) — never leave them darkened or relief-stripped on unmount
  useEffect(() => {
    return () => {
      mats.forEach((m) => {
        if (m.userData.baseColor) m.color.copy(m.userData.baseColor as THREE.Color);
        if (m.userData.baseBump !== undefined) m.bumpScale = m.userData.baseBump as number;
        if (m.userData.baseNormal) m.normalScale.copy(m.userData.baseNormal as THREE.Vector2);
      });
    };
  }, [mats]);

  const normalized = useMemo(() => {
    const root = new THREE.Group();
    // the provided asset lies flat (y = thickness, z = height):
    // pitch it upright so the cover faces the camera
    const pre = new THREE.Box3().setFromObject(scene);
    const preSize = pre.getSize(new THREE.Vector3());
    if (preSize.z >= preSize.x && preSize.z >= preSize.y) {
      scene.rotation.x = -Math.PI / 2;
    }
    root.add(scene);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s = H / size.y;
    root.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(s);
    root.position.sub(center);
    // the book's world-space thickness, for seating the lantern planes
    // inside the cover boards
    root.userData.depth = size.z * s;
    return root;
  }, [scene]);
  const lanternZ = ((normalized.userData.depth as number) ?? D) / 2 - 0.015;
  return (
    <group>
      <primitive object={normalized} />
      {/* the light inside the book: unlit planes seated within each cover
          board, visible only through the cut letterforms. Color luminance
          sits just under the Bloom threshold (0.55) so the composer never
          smears it — the cut stays knife-sharp at any brightness. Two
          planes so the effect is orientation-proof; the uncut front cover
          simply hides its one. */}
      {[lanternZ, -lanternZ].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial color="#c97f2e" side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline: spin in → gilding ignites → hard dolly into the cover    */
/* ------------------------------------------------------------------ */

function IntroScene({
  emerge,
  plain = false,
  holeRef,
  holdGate,
  onHold,
  onFade,
  onDive,
  onAtmos,
  onEmerge,
  onDone,
}: {
  emerge: boolean;
  /** inspection mode: flat white rig, no ignition, no bloom, no glow */
  plain?: boolean;
  holeRef?: MutableRefObject<HoleRect | null>;
  /** EXPERIMENT (owner, 2026-08-11): the book holds after arrival until
      a click releases the dive. Shared gate with the root's click. */
  holdGate?: MutableRefObject<{ holding: boolean; released: boolean }>;
  onHold?: () => void;
  onFade: (v: number) => void;
  onDive: (v: number) => void;
  onAtmos: (ignite: number, dive: number, t: number) => void;
  onEmerge: (rise: number, t: number, ignite: number, doorGlow: number) => void;
  onDone: (finished: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const igniteRef = useRef(0); // timeline units (0..~1.15), for the tomb callbacks
  const bookIgnite = useRef(0); // canonical units for TheBook (timeline × IGNITE_FULL)
  const emergeShade = useRef(1);
  const doneRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const heldFor = useRef<number | null>(null); // hold duration, once released
  const { camera, size } = useThree();

  useFrame(({ clock }) => {
    // the timeline starts on the first *rendered* frame, so slow texture
    // loads on mobile don't swallow the opening beats of the spin
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    // 1.15 = overall tempo: the whole sequence plays ~15% faster
    const t = (clock.getElapsedTime() - startRef.current) * 1.15;
    const g = group.current;
    if (!g) return;

    // emergence prefix: the book rises out of the tomb's doorway before
    // the familiar timeline begins
    // (turtle-hold experiment removed at the owner's call)
    const E = emerge ? 0.85 : 0;
    // HOLD EXPERIMENT: freeze the dive clock (tt) at the chill point
    // after arrival; the click releases it exactly where it froze. All
    // t-based motion (bob, settle, boom decay, chamber flicker) keeps
    // living during the hold, so the book breathes in place.
    const HOLD_AT = 2.4;
    const raw = Math.max(0, t - E);
    let tt = raw;
    const gate = holdGate?.current;
    if (gate && E > 0) {
      if (gate.released) {
        if (heldFor.current === null) heldFor.current = raw - HOLD_AT;
        tt = raw - heldFor.current;
      } else if (raw >= HOLD_AT) {
        if (!gate.holding) {
          gate.holding = true;
          onHold?.();
        }
        tt = HOLD_AT;
      }
    }
    let riseEase = 1;
    let rise = 1;
    if (E > 0) {
      rise = Math.min(1, Math.max(0, t / E));
      // slow → fast: it CREEPS out of the dark, accelerating the whole
      // way, and arrives at maximum velocity
      riseEase = easeInExpo(rise);
    }
    // scale gets its OWN curve: easeInExpo hides the first ~60% of the
    // motion entirely (the "book just appears" complaint) — quadratic
    // growth is visible from the first frame while still accelerating
    const scaleEase = E > 0 ? rise * rise : 1;
    // BOOM on arrival: momentum carries it HUGE — ~1.65x resting size,
    // nearly the height of the screen — then a damped spring drops it
    // back to its true size with a small natural squash before settling
    let boom = 0;
    if (E > 0) {
      const tau = t - E;
      if (tau > 0) {
        const peak = 0.65;
        if (tau < 0.18) {
          boom = peak * (1 - Math.pow(1 - tau / 0.18, 3));
        } else {
          // single clean return — no oscillation, no squash (the ringing
          // spring read as too dramatic); quick: settled in ~0.4s
          boom = peak * Math.exp(-(tau - 0.18) * 7);
        }
      }
    }
    // no transparency: it emerges shaded, as if in the cave's shadow, and
    // brightens as it comes out
    emergeShade.current = E > 0 ? 0.5 + 0.5 * smooth(0.15, 0.85, rise) : 1;

    // NO flip gymnastics in the emergence: the book lies flat with its
    // cover facing UP, snaps out flat, then ONE smooth pitch swings the
    // cover down to face the camera — a single rotation does the whole
    // reveal. (Non-emerge path keeps the original grand 2π spin.)
    const tSpin = Math.max(0, t - E * 0.45);
    const spin = easeOutQuart(Math.min(1, tSpin / 2.6));
    g.rotation.y = E > 0 ? (1 - spin) * 0.45 : (1 - spin) * Math.PI * 2;
    const pitchBase = -0.06 + Math.sin(t * 1.1) * 0.012;
    const pitchEase = E > 0 ? smooth(E * 0.6, E + 0.7, t) : 1;
    // -1.32 rad, not a full -π/2: the flat pose tips a few degrees toward
    // the camera so the small cover reads on the way out
    g.rotation.x = -1.32 * (1 - pitchEase) + pitchBase * pitchEase;
    // the book starts small and DEEP INSIDE the doorway and comes forward
    // as it rises. The doorway's measured screen rect is unprojected to
    // world space at the start depth, so the rise begins in the actual
    // gap at every viewport — old eyeballed constants as the fallback
    // when there's no tomb to measure.
    const hole = E > 0 ? holeRef?.current : null;
    let startX = 0;
    let startY = -1.7;
    let startK = 0.03;
    if (hole) {
      // the camera is static until the dive: (0, 0, 4.15), fov 40
      const dist = 4.15 + 2.4;
      const worldH = 2 * dist * Math.tan((40 * Math.PI) / 360);
      const worldW = worldH * (size.width / size.height);
      startX = (hole.cx * 2 - 1) * (worldW / 2);
      // upper third of the hole — straight out, but seated higher
      startY = (1 - hole.cy * 2) * (worldH / 2) + hole.h * worldH * 0.28;
      // MUCH smaller than the doorway at first — it grows to full size
      // as it shoots out
      // truly from (almost) zero — a dot that blooms to full size
      startK = Math.min(0.06, Math.max(0.02, (hole.w * worldW * 0.62) / (W * 0.78)) * 0.1);
    }
    // straight out of the doorway: x/y HOLD at the hole's center for the
    // whole rise (the zoom is pure z), then the book floats gently to
    // frame center after it's fully out
    const lift = E > 0 ? smooth(E, E + 1.1, t) : 1;
    g.position.x = startX * (1 - lift);
    g.position.y = startY * (1 - lift) + Math.sin(t * 1.3) * 0.03;
    // deeper start = the exit reads as a ZOOM straight at the camera
    g.position.z = -2.4 * (1 - riseEase);
    // the book never stops growing in the frame — presence keeps building
    // from the first frame until the dive takes over
    const s =
      (0.78 + (1 - Math.pow(1 - Math.min(1, tSpin / 5), 3)) * 0.34) *
      (startK + (1 - startK) * scaleEase) *
      (1 + boom);
    g.scale.setScalar(s);

    // the dolly: no let-up — it accelerates until the cover kisses the lens
    const d = easeInExpo(smooth(3.85, 5.05, tt));

    // the awakening: the gold stirs early, builds in waves, and is still
    // climbing when the dive begins — no dead air, no single hit
    // (inspection mode kills the ignition entirely)
    const ig = plain
      ? 0
      : (0.14 * smooth(1.6, 2.4, tt) + 0.36 * smooth(2.4, 3.4, tt) + 0.6 * smooth(3.4, 4.5, tt)) *
        (0.82 + 0.18 * Math.sin(t * 6.3) * Math.sin(t * 2.7)) *
        (1 + d * 0.9);
    igniteRef.current = ig;
    // TheBook consumes the same timeline scaled to the canonical glow.
    // CAPPED at 1: the dive surge used to push ~2x past the owner's
    // dialed level — nothing may exceed the calibrated brightness.
    bookIgnite.current = Math.min(1, ig) * IGNITE_FULL;
    // the tomb layers hear about both the rise and the ignition, so the
    // awakening glow can light the whole chamber
    if (E > 0) {
      // the doorway blazes bright yellow at the click: a gradual fade
      // into the glow, held through the exit, dying away once it's out
      const doorGlow = smooth(0.05, 0.95, t) * (1 - smooth(E + 0.35, E + 1.4, t));
      onEmerge(rise, t, ig, doorGlow);
    }

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

    // the room answers: a glow that builds with the ignition and detonates
    // into the dive
    onAtmos(ig, plain ? 0 : d, t);

    // the last beats dissolve into golden light, not black
    onFade(smooth(4.82, 5.18, tt));

    if (tt >= TOTAL && !doneRef.current) {
      doneRef.current = true;
      onDone(true);
    }
  });

  return (
    <>
      <BookLights plain={plain} sweep />
      <group ref={group}>
        <TheBook igniteRef={bookIgnite} shadeRef={emergeShade} plain={plain} />
      </group>

    </>
  );
}

/* ------------------------------------------------------------------ */

/** coarse pointer ≈ phone/tablet: render leaner there */
function isCoarse(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export default function Intro3D({
  onDone,
  emerge = false,
  plain = false,
  onTombFade,
  holeRect,
}: {
  onDone: (finished: boolean) => void;
  emerge?: boolean;
  /** inspection mode: flat white rig, no ignition/bloom/glow */
  plain?: boolean;
  /** drives the persistent tomb layer (owned by Experience) behind us:
      fade = settle into the dark grade, glow = the ignition lighting
      the chamber back up (flickers with the gilding) */
  onTombFade?: (fade: number, glow: number, doorGlow?: number) => void;
  /** the tomb doorway, measured by Experience — anchors the emergence */
  holeRect?: MutableRefObject<HoleRect | null>;
}) {
  // TheBook is THE book — no GLB detection, no mount gate. The timeline
  // still starts on the first rendered frame (startRef in IntroScene),
  // so slow texture loads stay safe.
  const fadeRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  // HOLD EXPERIMENT: the book chills after arrival; a click enters it
  const holdGate = useRef({ holding: false, released: false });
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") onDone(false);
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  return (
    <div
      className={`introRoot ${emerge ? "overTomb" : ""}`}
      onClick={() => {
        const g = holdGate.current;
        if (g.holding && !g.released) {
          // the held book: this click opens it (releases the dive)
          g.released = true;
          setHolding(false);
        } else {
          onDone(false);
        }
      }}
    >
      <div className="introGlow" ref={glowRef} aria-hidden="true" />
      <div className="introCanvas" ref={canvasWrapRef}>
        <Canvas
          camera={{ position: [0, 0, 4.15], fov: 40 }}
          gl={{ antialias: true }} // no composer anymore — MSAA must cover the edges
          dpr={isCoarse() ? [1, 1.5] : [1, 1.75]}
        >
          <IntroScene
            emerge={emerge}
            plain={plain}
            holeRef={holeRect}
            holdGate={holdGate}
            onHold={() => setHolding(true)}
            onEmerge={(rise, t, ignite, doorGlow) => {
              // the tomb (persistent layer behind us) settles into its
              // 70/40 grade through the rise, then the ignition's own
              // flicker lights the chamber back up
              // the room starts dimming as the book shoots out
              onTombFade?.(smooth(0.6, 2.4, t), Math.min(1.2, ignite), doorGlow);
              void rise;
            }}
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
            onAtmos={(ig, d, t) => {
              const el = glowRef.current;
              if (!el) return;
              // breathe while the gilding ignites, then detonate with the dive:
              // d*(1-d) spikes mid-dive and dies into the golden flash
              const breathe = 1 + 0.06 * Math.sin(t * 2.1);
              const burst = d * (1 - d) * 4;
              const scale = (0.9 + ig * 0.28 + d * 2.1) * breathe;
              el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
              el.style.opacity = Math.min(1, ig * 0.42 * breathe + burst).toFixed(3);
            }}
            onDone={onDone}
          />
        </Canvas>
      </div>
      <div className="introGrain" ref={grainRef} aria-hidden="true" />
      <div className="introFade" ref={fadeRef} aria-hidden="true">
        <div className="rampLogo" aria-label="ramp" />
      </div>
      <div className="skipHint">{holding ? "" : "tap to skip"}</div>
      {/* the held-book hero copy (owner mock) — same treatment as the
          closed view, adapted to this state's affordance */}
      {holding && (
        <>
          <div className="closedTitle">Tap to open the book.</div>
          <div className="closedTagline">
            Use The Kumar Method to run your life.
            <br />
            Use Ramp to run your business.
          </div>
        </>
      )}
    </div>
  );
}
