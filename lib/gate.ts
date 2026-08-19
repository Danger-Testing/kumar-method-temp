/* CHAPTER GATING — the day-by-day rollout (built for the Ramp handoff).

   HOW TO CONTROL, in priority order:

   1. Set the Vercel env var  NEXT_PUBLIC_CHAPTERS_UNLOCKED=<1..10>
      for a hard override (takes effect on the next deploy — it is
      inlined at build time). Set it to 10 to open the whole book.

   2. Do nothing: chapters unlock automatically, ONE PER DAY, starting
      from UNLOCK_START below (chapter I is live on day one, chapter II
      the next day, and so on). Uses the reader's local clock — a
      visitor in Tokyo unlocks a few hours before New York, which is
      fine for an experiment. Change UNLOCK_START to the real launch
      date before going live.

   3. Emergency lever: flip UNLOCK_ALL to true and deploy. */

export const UNLOCK_ALL = false;

/** day one — chapter I only on this date, +1 chapter per day after */
/* STATIC FALLBACK ONLY — the real schedule lives in Edge Config via
   /api/gate. Far-future on purpose: a deployment WITHOUT the env vars
   (e.g. a fresh clone) safely holds at chapter I, frozen "in 2 days",
   instead of running an accidental calendar. */
export const UNLOCK_START = "2027-01-01";

export const TOTAL_CHAPTERS = 10;

/* WHERE THE LIVE GATE LIVES. The book is embedded at
   ramp.com/thekumarmethod by Ramp's own rewrite, and that rewrite
   covers the page only: a reader there fetching a relative
   "/api/gate" hits ramp.com/api/gate, which is a 404 from Ramp's
   marketing site (verified 2026-08-18). The gate silently fell back to
   the static schedule, so the /schedule buttons moved nothing for the
   readers who actually matter. The endpoint is absolute now — one
   origin, CORS-open, no env var and nothing for Ramp to deploy.
   Localhost stays same-origin so local dev reads local values. */
export const GATE_ORIGIN = "https://plain-rules.vercel.app";

export function gateEndpoint(): string {
  const host = typeof window === "undefined" ? "" : window.location.hostname;
  const local = host === "localhost" || host === "127.0.0.1";
  return local ? "/api/gate" : `${GATE_ORIGIN}/api/gate`;
}


export function unlockedChapters(now = new Date()): number {
  const env = Number(process.env.NEXT_PUBLIC_CHAPTERS_UNLOCKED);
  if (Number.isFinite(env) && env >= 1) return Math.min(TOTAL_CHAPTERS, Math.floor(env));
  if (UNLOCK_ALL) return TOTAL_CHAPTERS;
  const start = new Date(`${UNLOCK_START}T00:00:00`);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(TOTAL_CHAPTERS, days + 1));
}

/** days until the NEXT chapter unlocks (>=1; 0 = the book is open) —
    drives the teaser leaf's copy ("tomorrow" vs "in N days") */
export function nextUnlockInDays(now = new Date()): number {
  const n = unlockedChapters(now);
  if (n >= TOTAL_CHAPTERS) return 0;
  const start = new Date(`${UNLOCK_START}T00:00:00`);
  const next = new Date(start.getTime() + n * 86400000);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 86400000));
}

/** pure gate math — the /api/gate route feeds it live Edge Config
    values; the static exports above remain the offline fallback */
export function computeGate(start: string, override: number | null, now = new Date()) {
  let unlocked: number;
  if (override && override >= 1) {
    unlocked = Math.min(TOTAL_CHAPTERS, Math.floor(override));
  } else {
    const s = new Date(`${start}T00:00:00`);
    if (now.getTime() < s.getTime()) {
      // BEFORE day one: not started — chapter I, frozen "in 2 days"
      return { unlocked: 1, daysToNext: 2 };
    }
    unlocked = Math.max(1, Math.min(TOTAL_CHAPTERS, Math.floor((now.getTime() - s.getTime()) / 86400000) + 1));
  }
  let daysToNext = 0;
  if (unlocked < TOTAL_CHAPTERS) {
    if (override && override >= 1) {
      // countdown PAUSED (pre-launch or manual hold): the teaser shows
      // a frozen "in 2 days" (owner call, 2026-08-13) — no live clock
      daysToNext = 2;
    } else {
      const s = new Date(`${start}T00:00:00`);
      const next = new Date(s.getTime() + unlocked * 86400000);
      daysToNext = Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 86400000));
    }
  }
  return { unlocked, daysToNext };
}

/* ----------------------------------------------------------------
   TIMED DROPS (owner, 2026-08-18: "next 4 chapters release tomorrow
   at 7pm pst ... the rest same time on friday").

   A drop is a wall-clock instant plus the chapter count it opens.
   They live in Edge Config as `drops` and are applied at READ time —
   there is no cron, no job, nothing that can fail to fire. The moment
   /api/gate is asked after `at`, the chapters are live (the GET is CDN
   cached 60s, so readers see it within a minute of the hour).

   Drops only ever open MORE of the book than the manual state, never
   less, so a pending drop can't quietly hide a chapter someone already
   released by hand.
   ---------------------------------------------------------------- */

export type Drop = {
  /** ISO instant, stored in UTC */
  at: string;
  /** how many chapters are live once this fires (1..TOTAL_CHAPTERS) */
  to: number;
};

const dropTime = (d: Drop) => new Date(d.at).getTime();

/** keep only well-formed drops, soonest first */
export function normalizeDrops(value: unknown): Drop[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (d): d is Drop =>
        !!d &&
        typeof (d as Drop).at === "string" &&
        Number.isFinite(new Date((d as Drop).at).getTime()) &&
        typeof (d as Drop).to === "number" &&
        (d as Drop).to >= 1 &&
        (d as Drop).to <= TOTAL_CHAPTERS,
    )
    .map((d) => ({ at: new Date(d.at).toISOString(), to: Math.floor(d.to) }))
    .sort((a, b) => dropTime(a) - dropTime(b));
}

export function elapsedDrops(drops: Drop[], now = new Date()): Drop[] {
  return drops.filter((d) => dropTime(d) <= now.getTime());
}

export function pendingDrops(drops: Drop[], now = new Date()): Drop[] {
  return drops.filter((d) => dropTime(d) > now.getTime());
}

/** the gate with timed drops folded in: whichever is further along,
    the manual state or a drop that has already fired */
export function applyDrops(base: number, drops: Drop[], now = new Date()) {
  const fired = elapsedDrops(drops, now);
  const unlocked = Math.min(
    TOTAL_CHAPTERS,
    Math.max(base, ...fired.map((d) => d.to), 1),
  );
  const next = pendingDrops(drops, now).find((d) => d.to > unlocked) ?? null;
  return {
    unlocked,
    nextDropAt: next?.at ?? null,
    nextDropTo: next?.to ?? null,
  };
}

/** whole days until the next timed drop — feeds the teaser leaf's
    "tomorrow" / "in N days" copy on the reader's own clock */
export function daysUntil(at: string, now = new Date()): number {
  return Math.max(1, Math.ceil((new Date(at).getTime() - now.getTime()) / 86400000));
}

/* THE TEASER LEAF'S COPY, one source for both sides (owner,
   2026-08-18: the "next chapter arrives in two days" page should say
   what the dashboard actually scheduled, and follow it when the
   schedule changes). The reader renders this against ITS OWN clock —
   same rule as the rest of the gate — and /schedule renders the very
   same string so what the owner reads is what a reader reads. */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "tomorrow at 7:00 PM" / "Friday at 7:00 PM" / "August 30 at 7:00 PM" */
export function teaserWhen(at: string, now = new Date()): string {
  const d = new Date(at);
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const days = Math.round((startOfDay(d) - startOfDay(now)) / 86400000);
  if (days <= 0) return `today at ${time}`;
  if (days === 1) return `tomorrow at ${time}`;
  if (days < 7) return `${d.toLocaleDateString(undefined, { weekday: "long" })} at ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "long", day: "numeric" })} at ${time}`;
}

/** the whole teaser sentence, or null when there is nothing to promise
    (no drop scheduled — the caller keeps its old "in N days" copy) */
export function teaserLine(chapterRoman: string, at: string | null, now = new Date()): string | null {
  if (!at) return null;
  return `Chapter ${chapterRoman} arrives ${teaserWhen(at, now)}`;
}
