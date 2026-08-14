"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chapters } from "@/lib/content";
import { pages, firstPageOfChapter, seeded, type BookPage } from "@/lib/pages";
import { unlockedChapters } from "@/lib/gate";
import BookBanner from "@/components/BookBanner";
import LegalLine from "@/components/LegalLine";

/* ------------------------------------------------------------------ */
/*  Ornaments                                                          */
/* ------------------------------------------------------------------ */

function Flourish() {
  return (
    <svg className="flourish" viewBox="0 0 260 44" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M130 24 C 108 8, 76 6, 60 16 C 48 24, 52 36, 63 35 C 72 34, 73 24, 64 21" />
        <path d="M130 24 C 152 8, 184 6, 200 16 C 212 24, 208 36, 197 35 C 188 34, 187 24, 196 21" />
        <path d="M60 16 C 44 8, 26 12, 18 20" />
        <path d="M200 16 C 216 8, 234 12, 242 20" />
      </g>
      <path
        d="M130 12 C 134 17, 137 20, 130 30 C 123 20, 126 17, 130 12 Z"
        fill="currentColor"
      />
      <circle cx="10" cy="22" r="2.4" fill="currentColor" />
      <circle cx="250" cy="22" r="2.4" fill="currentColor" />
    </svg>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div className="eyebrow" aria-label={text}>
      <span className="eyebrowLine" />
      <span className="eyebrowText">{text}</span>
      <span className="eyebrowLine" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page content (also reused, mirrored, as show-through ghosting)     */
/* ------------------------------------------------------------------ */

/* Etchings on SOME pages (Kendall's idea). PARKED for now — the crew
   called the first batch "a little cheap" (2026-08-13). Flip this ONE
   flag when there's art everyone likes; the assets and wiring stay. */
const SHOW_ILLUSTRATIONS = false;

const ILLUSTRATIONS: Record<string, { src: string; alt: string }> = {
  "0-3": { src: "/illustrations/rule-0-3.png", alt: "A modest car on a lane before a stone cottage" },
  "0-5": { src: "/illustrations/rule-0-5.png", alt: "Four chairs drawn close around a small table with a lamp" },
  "0-9": { src: "/illustrations/rule-0-9.png", alt: "An hourglass beside a stack of coins and a pocket watch" },
};

function PageContent({ page, pageNumber }: { page: BookPage; pageNumber: number }) {
  const ch = chapters[page.chapter];

  if (page.kind === "chapter") {
    const introChars = ch.intro.join("").length;
    const density = introChars > 820 ? "denser" : introChars > 640 ? "dense" : "";
    return (
      <div className={`pageInner chapterPage ${density}`}>
        <div className="tinyFleuron" aria-hidden="true">
          ❦
        </div>
        <Eyebrow text={ch.eyebrow} />
        <h1
          className="bigTitle"
          style={{
            fontSize: `${Math.min(
              13,
              86 / (0.66 * Math.max(...ch.titleLines.map((l) => l.length)))
            ).toFixed(2)}cqw`,
          }}
        >
          {ch.titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <Flourish />
        <div className="intro">
          {ch.intro.map((para, i) => (
            <p key={i}>
              <span className="dropcap" aria-hidden="true">
                {para.charAt(0)}
              </span>
              <span className="dropcapRest">{para.slice(1)}</span>
            </p>
          ))}
        </div>
        <div className="folio">P. {pageNumber}</div>
      </div>
    );
  }

  if (page.kind === "locked") {
    // the gate's teaser: names the next chapter, promises tomorrow
    const next = chapters[page.chapter];
    return (
      <div className="pageInner chapterPage lockedPage">
        <div className="tinyFleuron" aria-hidden="true">
          ❦
        </div>
        <Eyebrow text={next.eyebrow} />
        <h1
          className="bigTitle"
          style={{
            fontSize: `${Math.min(
              13,
              86 / (0.66 * Math.max(...next.titleLines.map((l) => l.length)))
            ).toFixed(2)}cqw`,
          }}
        >
          {next.titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <Flourish />
        <p className="lockedNote">This chapter arrives tomorrow.</p>
        <div className="folio">P. {pageNumber}</div>
      </div>
    );
  }

  return (
    <div className="pageInner rulesPage">
      <div className="runningHead">
        <span className="runningStar" aria-hidden="true">
          ✦
        </span>
        <span className="runningText">{ch.shortName}</span>
        <span className="runningStar" aria-hidden="true">
          ✦
        </span>
      </div>
      <div className="rules">
        {SHOW_ILLUSTRATIONS && page.ruleIndexes.length === 1 && ILLUSTRATIONS[`${page.chapter}-${page.ruleIndexes[0]}`] && (
          <img
            className="ruleArt"
            src={ILLUSTRATIONS[`${page.chapter}-${page.ruleIndexes[0]}`].src}
            alt={ILLUSTRATIONS[`${page.chapter}-${page.ruleIndexes[0]}`].alt}
            draggable={false}
          />
        )}
        {page.ruleIndexes.map((ri) => (
          <div className="rule" key={ri}>
            <div className="ruleNum" aria-label={`Rule ${ri + 1}`}>
              <span className="ruleNumLine" aria-hidden="true" />
              {ri + 1}
              <span className="ruleNumLine" aria-hidden="true" />
            </div>
            <p className="ruleText">{ch.rules[ri]}</p>
          </div>
        ))}
      </div>
      <div className="folio">P. {pageNumber}</div>
    </div>
  );
}

/* The share mark (owner/Kendall, 2026-08-13): quiet book chrome on
   the folio row — Kendall vetoed the boxed version, so it's a
   printer's mark + Fell italic. Native share sheet where it exists,
   clipboard elsewhere. Sits on the corner OPPOSITE the folio. */
function ShareRule({ page }: { page: BookPage }) {
  const [copied, setCopied] = useState(false);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ch = chapters[page.chapter];
    const text =
      page.kind === "rules"
        ? `“${ch.rules[page.ruleIndexes[0]]}” — The Kumar Method`
        : "The Kumar Method — a short list of plain rules about money and about life.";
    const url = window.location.origin;
    // NATIVE share sheet wherever the Web Share API exists — macOS
    // included (owner call, 2026-08-13); clipboard is the fallback
    if (navigator.share) {
      // the user closing the sheet is not an error
      navigator.share({ title: "The Kumar Method", text, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1700);
    } catch {
      /* clipboard denied: nothing sensible to do */
    }
  };
  return (
    <button type="button" className="pageShare" onClick={share} onPointerDown={stop} onPointerUp={stop}>
      <svg className="shareIco" viewBox="0 0 16 16" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.8 L8 9.6" />
          <path d="M5.3 4.3 L8 1.6 L10.7 4.3" />
          <path d="M5.2 6.9 H3.4 V14.1 H12.6 V6.9 H10.8" />
        </g>
      </svg>
      {copied ? "copied" : "share"}
    </button>
  );
}

/* The page's ramp mark (owner-picked placement: bottom center on the
   folio row), linking to ramp.com. */
function RampMarks() {
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const spots = [{ id: "bottom", cls: "prBottomCenter" }];
  return (
    <>
      {spots.map((sp) => (
        <a
          key={sp.id}
          className={`pageRamp ${sp.cls}`}
          href="https://ramp.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ramp"
          onClick={stop}
          onPointerDown={stop}
          onPointerUp={stop}
        >
          <span className="prMark" aria-hidden="true" />
        </a>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  A physical leaf of paper                                           */

/* ------------------------------------------------------------------ */

function PageLeaf({
  index,
  animClass,
  side = "single",
  page: pageOverride,
}: {
  index: number;
  animClass: string;
  side?: "single" | "left" | "right";
  /** the gate's teaser leaf lives outside the built page list */
  page?: BookPage;
}) {
  const page = pageOverride ?? pages[index];
  const rand = seeded(index + 3);

  const stainCount = 3 + Math.floor(rand() * 3);
  const stains = Array.from({ length: stainCount }, () => ({
    left: 4 + rand() * 88,
    top: 3 + rand() * 90,
    size: 4 + rand() * 16,
    opacity: 0.04 + rand() * 0.09,
    warm: rand() > 0.35,
  }));
  const smudgeTop = 12 + rand() * 70;

  // every leaf samples the paper scan differently: mirrored, panned, zoomed —
  // so no two pages share the same cracks
  const photo = {
    flipX: rand() > 0.5 ? -1 : 1,
    flipY: rand() > 0.5 ? -1 : 1,
    size: 115 + rand() * 45,
    x: rand() * 100,
    y: rand() * 100,
  };

  const ghost = pages[index + 1];

  return (
    <div className={`leaf ${animClass}`}>
      <div className={`paper side-${side}`}>
        {/* a real scanned sheet of old paper, toned to match */}
        <div
          className="photoPaper"
          aria-hidden="true"
          style={{
            transform: `scale(${photo.flipX}, ${photo.flipY})`,
            backgroundSize: `auto ${photo.size.toFixed(0)}%`,
            backgroundPosition: `${photo.x.toFixed(1)}% ${photo.y.toFixed(1)}%`,
          }}
        />

        {/* show-through of the following leaf, mirrored, like thin old stock */}
        {ghost && (
          <div className="ghost" aria-hidden="true">
            <PageContent page={ghost} pageNumber={index + 2} />
          </div>
        )}

        {/* foxing stains */}
        {stains.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`stain ${s.warm ? "warmStain" : "greyStain"}`}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}cqw`,
              height: `${s.size * (0.7 + (i % 3) * 0.2)}cqw`,
              opacity: s.opacity,
            }}
          />
        ))}
        <span className="smudge" aria-hidden="true" style={{ top: `${smudgeTop}%` }} />

        <PageContent page={page} pageNumber={index + 1} />

        <div className="grain" aria-hidden="true" />
        <div className="blotch" aria-hidden="true" />
        <div className="edgeShade" aria-hidden="true" />
        <RampMarks />
        {page.kind !== "locked" && <ShareRule page={page} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmosphere                                                         */
/* ------------------------------------------------------------------ */

function Dust() {
  const rand = seeded(99);
  const motes = Array.from({ length: 16 }, (_, i) => ({
    left: rand() * 100,
    top: rand() * 100,
    size: 1.5 + rand() * 3,
    delay: rand() * 18,
    duration: 14 + rand() * 18,
    opacity: 0.12 + rand() * 0.3,
    key: i,
  }));
  return (
    <div className="dust" aria-hidden="true">
      {motes.map((m) => (
        <span
          key={m.key}
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            opacity: m.opacity,
            animationDelay: `-${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The book                                                           */
/* ------------------------------------------------------------------ */

/* The deckled page edges are cut by an SVG turbulence mask. Chromium can
   intermittently fail to rasterize filter-heavy data-URI masks at paint
   time, which leaves the WHOLE page invisible. So we rasterize the mask
   once into a plain PNG (always paints) and hand it to CSS as a var;
   until it's ready the page renders unmasked — visible, just straight-
   edged for a moment. */
const MASK_SQUARE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='660' height='1000'%3E%3Cfilter id='r' x='-5%25' y='-5%25' width='110%25' height='110%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.006 0.0045' numOctaves='2' seed='11' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='3.5'/%3E%3C/filter%3E%3Crect x='3' y='3' width='654' height='994' fill='white' filter='url(%23r)'/%3E%3C/svg%3E";

function rasterizeMask(svg: string, cssVar: string) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 660;
    c.height = 1000;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 660, 1000);
    try {
      document.documentElement.style.setProperty(cssVar, `url("${c.toDataURL("image/png")}")`);
    } catch {
      /* leave unmasked — page stays visible */
    }
  };
  img.src = svg;
}

export default function Book() {
  const [current, setCurrent] = useState(0);
  const [hasTurned, setHasTurned] = useState(false);
  const [spread, setSpread] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // CHAPTER GATE (lib/gate.ts): only unlocked chapters render, plus a
  // teaser leaf naming the next one. Starts at 1 for a hydration-safe
  // first paint; the effect applies the real schedule immediately.
  const [unlockedCh, setUnlockedCh] = useState(1);
  useEffect(() => setUnlockedCh(unlockedChapters()), []);
  // the teaser leaf's index (= count of real visible pages); -1 = open
  const gateAt = unlockedCh >= chapters.length ? -1 : firstPageOfChapter(unlockedCh);
  const total = gateAt === -1 ? pages.length : gateAt + 1;
  const leafPage = (i: number): BookPage | undefined =>
    gateAt !== -1 && i === gateAt ? { kind: "locked", chapter: unlockedCh } : undefined;

  // pre-rasterize the page-edge mask (see note above Book)
  useEffect(() => {
    rasterizeMask(MASK_SQUARE, "--paper-mask");
  }, []);

  // wide landscape screens read as an open book, two pages at once
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (orientation: landscape)");
    const update = () => setSpread(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const base = spread ? current - (current % 2) : current;
  const step = spread ? 2 : 1;
  const [flip, setFlip] = useState<{ from: number; dir: 1 | -1 } | null>(null);
  const flipTimer = useRef<number | undefined>(undefined);
  const [scrubbing, setScrubbing] = useState(false);
  const scrubRef = useRef<HTMLDivElement>(null);

  // Kindle-style scrubber: drag along the bottom to fast-travel the book
  const scrubTo = (clientX: number) => {
    const el = scrubRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    let idx = Math.round(f * (total - 1));
    if (spread) idx -= idx % 2;
    setCurrent(idx);
    setHasTurned(true);
  };

  const go = useCallback(
    (to: number, curl = false) => {
      if (to < 0) to = 0;
      if (to >= total || to === current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (spread && !reduced) {
        setFlip({ from: base, dir: to > current ? 1 : -1 });
        window.clearTimeout(flipTimer.current);
        flipTimer.current = window.setTimeout(() => setFlip(null), 760);
      } else if (curl && !reduced) {
        // swipe on a single page (the mobile reader): a quick leaf curl
        // hinged at the spine edge. Taps stay INSTANT per the taste rule.
        setFlip({ from: base, dir: to > current ? 1 : -1 });
        window.clearTimeout(flipTimer.current);
        flipTimer.current = window.setTimeout(() => setFlip(null), 540);
      }
      setCurrent(to);
      setHasTurned(true);
    },
    [current, spread, base]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // never fight a form: typing in an input (the access modal) must
      // not turn pages or eat the spacebar
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(base + step);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(base - step);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, base, step]);

  const onPageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const backZone = spread ? 0.5 : 0.32;
    go(x < backZone ? base - step : base + step);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? base + step : base - step, true);
    }
  };

  return (
    <main
      className="scene"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        // the dark gutters around the page turn it too (owner: tapping
        // the black bars on mobile did nothing). Everything interactive
        // either stops propagation (scrubber, arrows, tail paper) or is
        // handled by the page's own zoned click.
        const t = e.target as HTMLElement | null;
        if (t && t.closest && t.closest(".bookArea")) return;
        go(e.clientX / window.innerWidth < 0.5 ? base - step : base + step);
      }}
    >
      <div className="haze" aria-hidden="true" />
      <Dust />

      <div
        className={`bookArea ${spread ? "spreadOpen" : ""}`}
        onClick={onPageClick}
        role="region"
        aria-label={`Book page ${base + 1}${spread ? ` and ${Math.min(base + 2, total)}` : ""} of ${total}`}
      >
        {/* the tail: the same parchment ribbon as the held book,
            tucked under the page's bottom edge (owner/Kendall mock,
            2026-08-13). FIRST child → painted under the leaves. */}
        <div className="readerTail">
          <BookBanner />
        </div>
        {(() => {
          // while a leaf is mid-flip, the layers underneath already show the
          // pages that will be revealed when it lands
          const underLeft = flip
            ? spread
              ? flip.dir === 1
                ? flip.from
                : flip.from - 2
              : flip.dir === 1
                ? flip.from + 1
                : flip.from
            : base;
          const underRight = flip ? (flip.dir === 1 ? flip.from + 3 : flip.from + 1) : base + 1;
          const ok = (i: number) => i >= 0 && i < total;
          return (
            <>
              {ok(underLeft) && (
                <div className="leafBox boxLeft" key={`L${underLeft}`}>
                  <PageLeaf
                    index={underLeft}
                    animClass={hasTurned ? "" : "enterFirst"}
                    side={spread ? "left" : "single"}
                    page={leafPage(underLeft)}
                  />
                </div>
              )}
              {spread && ok(underRight) && (
                <div className="leafBox boxRight" key={`R${underRight}`}>
                  <PageLeaf
                    index={underRight}
                    animClass={hasTurned ? "" : "enterFirst"}
                    side="right"
                    page={leafPage(underRight)}
                  />
                </div>
              )}
              {!spread && flip && (
                // the swipe curl: one full-width leaf hinged at the spine
                // edge. Keyed per turn — a reused node never restarts its
                // CSS animation (the old spread-flipper bug).
                <div
                  className={`flipper one ${flip.dir === 1 ? "flipFwdOne" : "flipRevOne"}`}
                  key={`flip1-${flip.from}-${flip.dir}`}
                >
                  <div className="flipFace faceFront">
                    {ok(flip.dir === 1 ? flip.from : flip.from - 1) && (
                      <PageLeaf
                        index={flip.dir === 1 ? flip.from : flip.from - 1}
                        animClass=""
                        side="single"
                        page={leafPage(flip.dir === 1 ? flip.from : flip.from - 1)}
                      />
                    )}
                  </div>
                </div>
              )}
              {spread && flip && (
                <div
                  className={`flipper ${flip.dir === 1 ? "flipFwd" : "flipRev"}`}
                  key={`flip-${flip.from}-${flip.dir}`}
                >
                  <div className="flipFace faceFront">
                    {ok(flip.dir === 1 ? flip.from + 1 : flip.from) && (
                      <PageLeaf
                        index={flip.dir === 1 ? flip.from + 1 : flip.from}
                        animClass=""
                        side={flip.dir === 1 ? "right" : "left"}
                        page={leafPage(flip.dir === 1 ? flip.from + 1 : flip.from)}
                      />
                    )}
                  </div>
                  <div className="flipFace faceBack">
                    {ok(flip.dir === 1 ? flip.from + 2 : flip.from - 1) && (
                      <PageLeaf
                        index={flip.dir === 1 ? flip.from + 2 : flip.from - 1}
                        animClass=""
                        side={flip.dir === 1 ? "left" : "right"}
                        page={leafPage(flip.dir === 1 ? flip.from + 2 : flip.from - 1)}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      <div className="vignette" aria-hidden="true" />

      {/* (the "tap the page" hint is retired — owner, 2026-08-13) */}

      <LegalLine />

      <div
        className={`scrubber ${scrubbing ? "scrubbing" : ""} ${hasTurned ? "" : "scrubHidden"}`}
        role="slider"
        aria-label="Scrub through pages"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={base + 1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          // stop the browser starting a text selection on the page while
          // the pointer drags across it mid-scrub
          e.preventDefault();
          document.body.style.userSelect = "none";
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrubbing(true);
          scrubTo(e.clientX);
        }}
        onPointerMove={(e) => {
          if (scrubbing) scrubTo(e.clientX);
        }}
        onPointerUp={() => {
          document.body.style.userSelect = "";
          setScrubbing(false);
        }}
        onPointerCancel={() => {
          document.body.style.userSelect = "";
          setScrubbing(false);
        }}
      >
        {scrubbing && <div className="scrubLabel">{chapters[pages[Math.min(base, pages.length - 1)].chapter].shortName}</div>}
        <div className="scrubLine" ref={scrubRef}>
          <svg className="scrubFlourish" viewBox="0 0 300 12" aria-hidden="true">
            <path
              d="M14 6 C 6 11, 2 4, 9 3 C 13 2, 15 4, 14 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <path
              d="M14 5.5 C 90 3, 210 7, 296 4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="scrubThumb"
            aria-hidden="true"
            style={{ left: `${((base / (total - 1)) * 100).toFixed(2)}%` }}
          />
        </div>
        <div className="scrubCount">
          {base + 1} / {total}
        </div>
      </div>

      {/* (the corner tagline + access modal are retired — the tail
          under the page carries the tagline and the email capture now,
          owner/Kendall 2026-08-13) */}

      {/* tap arrows flanking the scrubber — appear with it */}
      <button
        className={`pageArrow arrowLeft ${hasTurned ? "" : "scrubHidden"}`}
        aria-label="Previous page"
        onClick={(e) => {
          e.stopPropagation();
          go(base - step);
        }}
      >
        <svg viewBox="0 0 12 20" aria-hidden="true">
          <path
            d="M9.5 2.5 L3.5 10 L9.5 17.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      <button
        className={`pageArrow arrowRight ${hasTurned ? "" : "scrubHidden"}`}
        aria-label="Next page"
        onClick={(e) => {
          e.stopPropagation();
          go(base + step);
        }}
      >
        <svg viewBox="0 0 12 20" aria-hidden="true">
          <path
            d="M2.5 2.5 L8.5 10 L2.5 17.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

    </main>
  );
}
