"use client";

import { useCallback, useEffect, useState } from "react";
import { chapters } from "@/lib/content";
import { computeGate } from "@/lib/gate";

/* THE RELEASE DASHBOARD, v3 — simpler (owner). One decision on top:
   the countdown. Paused = chapter I only and the book promises "in 2
   days" (frozen). START COUNTDOWN makes today day one → chapter II
   tomorrow, one per day after, on each reader's local clock. */

type Gate = {
  start: string;
  override: number | null;
  unlocked: number;
  daysToNext: number;
  total: number;
};

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function SchedulePage() {
  const [gate, setGate] = useState<Gate | null>(null);
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setPasscode(window.localStorage.getItem("gatePasscode") ?? "");
    fetch("/api/gate", { cache: "no-store" })
      .then((r) => r.json())
      .then((g: Gate) => setGate({ ...g, ...computeGate(g.start, g.override) }))
      .catch(() => setMsg({ kind: "err", text: "Couldn't load the gate state." }));
  }, []);

  const send = useCallback(
    async (payload: Record<string, unknown>, okText: string) => {
      if (!passcode.trim()) {
        setMsg({ kind: "err", text: "Enter the team passcode (top right) first." });
        return;
      }
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
        setGate({ ...data, ...computeGate(data.start, data.override) });
        setMsg({ kind: "ok", text: `${okText} Readers see it within a minute.` });
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

  const paused = gate.override !== null;
  const canAct = !busy;

  return (
    <main className="dash">
      <header className="dashHead">
        <div>
          <h1>Chapter releases</h1>
          <p className="dashMuted">
            {gate.unlocked} of {gate.total} live ·{" "}
            {paused ? "countdown NOT started — the book says “in 2 days”" : "countdown running: one chapter per day"}
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
        {paused ? (
          <div className="dashRow">
            <button
              className="dashBtn primary big"
              disabled={!canAct}
              onClick={() =>
                send(
                  { start: localToday(), override: null },
                  "Countdown started — today is day one, the next chapter lands tomorrow.",
                )
              }
            >
              Start countdown
            </button>
            <span className="dashMuted">Today becomes day one. Next chapter tomorrow, one per day after.</span>
          </div>
        ) : (
          <div className="dashRow">
            <button
              className="dashBtn big"
              disabled={!canAct}
              onClick={() => send({ override: gate.unlocked }, "Countdown paused where it stands.")}
            >
              Pause countdown
            </button>
            <span className="dashMuted">
              Day one: {new Date(`${gate.start}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.
              Pausing freezes the book at {gate.unlocked} chapter{gate.unlocked > 1 ? "s" : ""}.
            </span>
          </div>
        )}
      </section>

      <section className="dashCard">
        <table className="dashTable">
          <tbody>
            {chapters.map((ch, i) => {
              const n = i + 1;
              const live = n <= gate.unlocked;
              return (
                <tr key={ch.roman}>
                  <td>
                    <strong>
                      {ch.roman}. {ch.fullName}
                    </strong>
                  </td>
                  <td>
                    <span className={`dashPill ${live ? "live" : ""}`}>{live ? "Live" : "Locked"}</span>
                  </td>
                  <td>
                    {!live && (
                      <button
                        className="dashBtn small primary"
                        disabled={!canAct}
                        onClick={() => send({ override: n }, `Chapters I–${ch.roman} are live (countdown paused).`)}
                      >
                        Set live now
                      </button>
                    )}
                    {live && n === gate.unlocked && n > 1 && (
                      <button
                        className="dashBtn small"
                        disabled={!canAct}
                        onClick={() => send({ override: n - 1 }, `Chapter ${ch.roman} hidden again.`)}
                      >
                        Undo
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
      </section>
    </main>
  );
}
