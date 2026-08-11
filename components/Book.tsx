"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chapters } from "@/lib/content";
import { pages, seeded, type BookPage } from "@/lib/pages";

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

/* ------------------------------------------------------------------ */
/*  A physical leaf of paper                                           */
/* ------------------------------------------------------------------ */

function PageLeaf({
  index,
  animClass,
  squareCorners,
  side = "single",
}: {
  index: number;
  animClass: string;
  squareCorners: boolean;
  side?: "single" | "left" | "right";
}) {
  const page = pages[index];
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
      <div className={`paper ${squareCorners ? "cornersSquare" : ""} side-${side}`}>
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

export default function Book() {
  const [current, setCurrent] = useState(0);
  const [hasTurned, setHasTurned] = useState(false);
  const [squareCorners, setSquareCorners] = useState(true);
  const [spread, setSpread] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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
    let idx = Math.round(f * (pages.length - 1));
    if (spread) idx -= idx % 2;
    setCurrent(idx);
    setHasTurned(true);
  };

  const go = useCallback(
    (to: number) => {
      if (to < 0) to = 0;
      if (to >= pages.length || to === current) return;
      if (spread && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setFlip({ from: base, dir: to > current ? 1 : -1 });
        window.clearTimeout(flipTimer.current);
        flipTimer.current = window.setTimeout(() => setFlip(null), 760);
      }
      setCurrent(to);
      setHasTurned(true);
    },
    [current, spread, base]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
      go(dx < 0 ? base + step : base - step);
    }
  };

  return (
    <main className="scene" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="haze" aria-hidden="true" />
      <Dust />

      <div
        className={`bookArea ${spread ? "spreadOpen" : ""}`}
        onClick={onPageClick}
        role="region"
        aria-label={`Book page ${base + 1}${spread ? ` and ${Math.min(base + 2, pages.length)}` : ""} of ${pages.length}`}
      >
        {(() => {
          // while a leaf is mid-flip, the layers underneath already show the
          // pages that will be revealed when it lands
          const underLeft = flip ? (flip.dir === 1 ? flip.from : flip.from - 2) : base;
          const underRight = flip ? (flip.dir === 1 ? flip.from + 3 : flip.from + 1) : base + 1;
          const ok = (i: number) => i >= 0 && i < pages.length;
          return (
            <>
              {ok(underLeft) && (
                <div className="leafBox boxLeft" key={`L${underLeft}`}>
                  <PageLeaf
                    index={underLeft}
                    animClass={hasTurned ? "" : "enterFirst"}
                    squareCorners={squareCorners}
                    side={spread ? "left" : "single"}
                  />
                </div>
              )}
              {spread && ok(underRight) && (
                <div className="leafBox boxRight" key={`R${underRight}`}>
                  <PageLeaf
                    index={underRight}
                    animClass={hasTurned ? "" : "enterFirst"}
                    squareCorners={squareCorners}
                    side="right"
                  />
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
                        squareCorners={squareCorners}
                        side={flip.dir === 1 ? "right" : "left"}
                      />
                    )}
                  </div>
                  <div className="flipFace faceBack">
                    {ok(flip.dir === 1 ? flip.from + 2 : flip.from - 1) && (
                      <PageLeaf
                        index={flip.dir === 1 ? flip.from + 2 : flip.from - 1}
                        animClass=""
                        squareCorners={squareCorners}
                        side={flip.dir === 1 ? "left" : "right"}
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

      <div className={`hint ${hasTurned ? "hintGone" : ""}`} aria-hidden={hasTurned}>
        tap the page · or use ← → to turn
      </div>

      <div
        className={`scrubber ${scrubbing ? "scrubbing" : ""}`}
        role="slider"
        aria-label="Scrub through pages"
        aria-valuemin={1}
        aria-valuemax={pages.length}
        aria-valuenow={base + 1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrubbing(true);
          scrubTo(e.clientX);
        }}
        onPointerMove={(e) => {
          if (scrubbing) scrubTo(e.clientX);
        }}
        onPointerUp={() => setScrubbing(false)}
        onPointerCancel={() => setScrubbing(false)}
      >
        {scrubbing && <div className="scrubLabel">{chapters[pages[base].chapter].shortName}</div>}
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
        <div className="scrubRow">
          <span className="scrubCount">
            {base + 1} / {pages.length}
          </span>
          <div className="scrubTrack" ref={scrubRef}>
            <div
              className="scrubFill"
              style={{ width: `${((base / (pages.length - 1)) * 100).toFixed(2)}%` }}
            />
            <div
              className="scrubThumb"
              aria-hidden="true"
              style={{ left: `${((base / (pages.length - 1)) * 100).toFixed(2)}%` }}
            />
          </div>
        </div>
      </div>

      <button
        className="cornerToggle"
        onClick={(e) => {
          e.stopPropagation();
          setSquareCorners((v) => !v);
        }}
      >
        corners: {squareCorners ? "square" : "worn"}
      </button>
    </main>
  );
}
