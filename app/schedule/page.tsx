"use client";

import { useCallback, useEffect, useState } from "react";
import { chapters } from "@/lib/content";

/* THE RELEASE DASHBOARD (owner, 2026-08-13, v2): a normal admin
   panel — deliberately NOT in the book's design language — with real
   controls. State lives in Vercel Edge Config behind /api/gate;
   changes are live for readers within ~a minute (CDN cache) and need
   no deploy. Writes require the team passcode (GATE_ADMIN_KEY env). */

const DAY = 86400000;

type Gate = {
  start: string;
  override: number | null;
  unlocked: number;
  daysToNext: number;
  total: number;
};

export default function SchedulePage() {
  const [gate, setGate] = useState<Gate | null>(null);
  const [passcode, setPasscode] = useState("");
  const [startInput, setStartInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setPasscode(window.localStorage.getItem("gatePasscode") ?? "");
    fetch("/api/gate", { cache: "no-store" })
      .then((r) => r.json())
      .then((g: Gate) => {
        setGate(g);
        setStartInput(g.start);
      })
      .catch(() => setMsg({ kind: "err", text: "Couldn't load the gate state." }));
  }, []);

  const send = useCallback(
    async (payload: Record<string, unknown>, okText: string) => {
      setBusy(true);
      setMsg(null);
      window.localStorage.setItem("gatePasscode", passcode);
      try {
        const res = await fetch("/api/gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Something went wrong.");
        setGate(data);
        setStartInput(data.start);
        setMsg({ kind: "ok", text: `${okText} Readers see it within about a minute.` });
      } catch (e) {
        setMsg({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong." });
      } finally {
        setBusy(false);
      }
    },
    [passcode],
  );

  if (!gate) {
    return (
      <main className="dash">
        <p className="dashMuted">{msg ? msg.text : "Loading…"}</p>
      </main>
    );
  }

  const start = new Date(`${gate.start}T00:00:00`);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const canAct = passcode.trim().length > 0 && !busy;

  return (
    <main className="dash">
      <header className="dashHead">
        <div>
          <h1>Chapter releases</h1>
          <p className="dashMuted">
            The Kumar Method · {gate.unlocked} of {gate.total} chapters live
            {gate.override ? " · autopilot paused (manual override)" : " · autopilot: one per day"}
          </p>
        </div>
        <input
          className="dashInput dashPass"
          type="password"
          placeholder="Team passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
      </header>

      {msg && <div className={`dashMsg ${msg.kind}`}>{msg.text}</div>}

      <section className="dashCard">
        <h2>Autopilot</h2>
        <p className="dashMuted">
          Chapter I goes live on day one, one more each day after, on the reader&rsquo;s local clock.
        </p>
        <div className="dashRow">
          <label>
            Day one
            <input
              className="dashInput"
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
            />
          </label>
          <button
            className="dashBtn primary"
            disabled={!canAct || !startInput}
            onClick={() => send({ start: startInput, override: null }, "Schedule saved and autopilot on.")}
          >
            Save schedule
          </button>
          {gate.override !== null && (
            <button
              className="dashBtn"
              disabled={!canAct}
              onClick={() => send({ override: null }, "Autopilot resumed.")}
            >
              Resume autopilot
            </button>
          )}
        </div>
      </section>

      <section className="dashCard">
        <h2>Chapters</h2>
        <table className="dashTable">
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Autopilot date</th>
              <th>Status</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((ch, i) => {
              const n = i + 1;
              const date = new Date(start.getTime() + i * DAY);
              const live = n <= gate.unlocked;
              return (
                <tr key={ch.roman}>
                  <td>
                    <strong>
                      {ch.roman}. {ch.fullName}
                    </strong>
                  </td>
                  <td>{fmt(date)}</td>
                  <td>
                    <span className={`dashPill ${live ? "live" : ""}`}>{live ? "Live" : "Scheduled"}</span>
                  </td>
                  <td>
                    {!live && (
                      <button
                        className="dashBtn small primary"
                        disabled={!canAct}
                        onClick={() =>
                          send(
                            { override: n },
                            `Chapters I–${ch.roman} are live now (autopilot paused).`,
                          )
                        }
                      >
                        Set live now
                      </button>
                    )}
                    {live && n === gate.unlocked && n > 1 && (
                      <button
                        className="dashBtn small"
                        disabled={!canAct}
                        onClick={() => send({ override: n - 1 }, `Rolled back: chapter ${ch.roman} is hidden again.`)}
                      >
                        Roll back
                      </button>
                    )}
                  </td>
                  <td>
                    <a className="dashLink" href={`/?chapters=${n}`} target="_blank" rel="noreferrer">
                      Preview
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="dashMuted dashFoot">
          &ldquo;Set live now&rdquo; pauses autopilot at that chapter; &ldquo;Resume autopilot&rdquo; hands
          control back to the calendar. Previews are cosmetic and per-visit. Passcode lives in the
          GATE_ADMIN_KEY environment variable.
        </p>
      </section>
    </main>
  );
}
