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
