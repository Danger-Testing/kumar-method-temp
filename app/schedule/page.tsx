"use client";

import { useEffect, useState } from "react";
import { chapters } from "@/lib/content";
import { UNLOCK_START, UNLOCK_ALL, TOTAL_CHAPTERS, unlockedChapters } from "@/lib/gate";

/* THE RELEASE DASHBOARD (owner, 2026-08-13): a plain internal page —
   /schedule, unlisted — for deciding and checking when chapters go
   live. Read-only by design: the levers are code/env (documented
   below) so nobody can fat-finger the gate from a browser. */

const DAY = 86400000;

export default function SchedulePage() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;

  const unlocked = unlockedChapters(now);
  const start = new Date(`${UNLOCK_START}T00:00:00`);
  const envOverride = Number(process.env.NEXT_PUBLIC_CHAPTERS_UNLOCKED);
  const overrideActive = Number.isFinite(envOverride) && envOverride >= 1;

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <main className="sched">
      <h1>The Kumar Method — release schedule</h1>
      <p className="schedMeta">
        Day one: <strong>{fmt(start)}</strong> · one chapter per day, on the reader&rsquo;s local clock ·
        currently live: <strong>
          {unlocked} of {TOTAL_CHAPTERS}
        </strong>
        {overrideActive && <> · env override active: NEXT_PUBLIC_CHAPTERS_UNLOCKED={envOverride}</>}
        {UNLOCK_ALL && <> · UNLOCK_ALL is on</>}
      </p>

      <table>
        <thead>
          <tr>
            <th>Ch.</th>
            <th>Title</th>
            <th>Unlocks</th>
            <th>Status</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((ch, i) => {
            const date = new Date(start.getTime() + i * DAY);
            const live = i < unlocked;
            const days = Math.ceil((date.getTime() - now.getTime()) / DAY);
            return (
              <tr key={ch.roman} className={live ? "live" : ""}>
                <td>{ch.roman}</td>
                <td>{ch.fullName}</td>
                <td>{fmt(date)}</td>
                <td>{live ? "LIVE" : days <= 1 ? "tomorrow" : `in ${days} days`}</td>
                <td>
                  <a href={`/?chapters=${i + 1}`} target="_blank" rel="noreferrer">
                    view site as of this day →
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>How to change the schedule</h2>
      <ol>
        <li>
          <strong>Move launch day:</strong> edit <code>UNLOCK_START</code> in <code>lib/gate.ts</code> and
          deploy. Chapter I is live on that date, +1 chapter each day after.
        </li>
        <li>
          <strong>Hard override:</strong> set the Vercel env var{" "}
          <code>NEXT_PUBLIC_CHAPTERS_UNLOCKED=&lt;1–10&gt;</code> and redeploy (10 opens the whole book).
          Unset it to return to the calendar.
        </li>
        <li>
          <strong>Emergency open-everything:</strong> set <code>UNLOCK_ALL = true</code> in{" "}
          <code>lib/gate.ts</code> and deploy.
        </li>
      </ol>
      <p className="schedNote">
        The preview links use <code>/?chapters=N</code> — cosmetic, per-visit only; they do not change
        anything for anyone else.
      </p>
    </main>
  );
}
