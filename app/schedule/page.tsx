"use client";

import { useCallback, useEffect, useState } from "react";
import { chapters } from "@/lib/content";
import { teaserLine, type Drop } from "@/lib/gate";

/* THE RELEASE DASHBOARD, v8 — the schedule, and nothing else (owner,
   2026-08-18: "I don't even know if you need all the individual
   chapters below with the Make It Live button ... maybe an edit button
   where you change the number of chapters that are releasing within
   that time span"). Two kinds of card:

   1. WHAT'S LIVE NOW — one number, editable.
   2. ONE CARD PER SCHEDULED DROP — ticking countdown, EDIT (how many
      chapters, and when), STOP RELEASE, and the exact sentence the
      book will show readers.

   Nothing polls a job: a drop is an instant in Edge Config, applied
   whenever /api/gate is read, so it fires with every browser closed.

   PLAIN NUMBERS here, roman numerals only inside the quoted reader
   copy (owner: "It's just for us, man") — the book itself still says
   "Chapter II" to its readers, and that quote is literally their
   string, so it stays roman.

   The write is authorized by the httpOnly cookie that
   /schedule?k=<DASH_SLUG> sets: the secret link IS the key. */

type Gate = {
  start: string;
  override: number | null;
  drops: Drop[];
  unlocked: number;
  daysToNext: number;
  nextDropAt: string | null;
  nextDropTo: number | null;
  total: number;
};

const span = (from: number, to: number) =>
  from >= to ? `Chapter ${to}` : `Chapters ${from}–${to}`;

const when = (at: string) =>
  new Date(at).toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

const countdown = (at: string, now: number) => {
  const s = Math.max(0, Math.floor((new Date(at).getTime() - now) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s % 60}s`;
  return `${m}m ${s % 60}s`;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** an ISO instant as the local wall-clock string a datetime-local wants */
const localSlot = (at: string) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** default for a new drop: the next hour, on the hour */
const defaultSlot = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return localSlot(d.toISOString());
};

export default function SchedulePage() {
  const [gate, setGate] = useState<Gate | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState<string | null>(null);
  const [slot, setSlot] = useState("");
  const [slotTo, setSlotTo] = useState(1);

  useEffect(() => {
    fetch("/api/gate", { cache: "no-store" })
      .then((r) => r.json())
      .then((g: Gate) => setGate(g))
      .catch(() => setMsg({ kind: "err", text: "Couldn't load the gate state." }));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const send = useCallback(async (payload: Record<string, unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setGate(data as Gate);
      setEditing(null);
      setMsg({ kind: "ok", text: `${okText} Readers see it within a minute.` });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }, []);

  if (!gate) {
    return (
      <main className="dash">
        <p className="dashMuted">{msg ? msg.text : "Loading…"}</p>
      </main>
    );
  }

  const { unlocked, total } = gate;
  const all = gate.drops ?? [];
  const pending = all
    .filter((d) => new Date(d.at).getTime() > now && d.to > unlocked)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  /* the drops stack: each one starts where the last left off */
  let floor = unlocked;
  const cards = pending.map((d) => {
    const card = { ...d, from: Math.min(total, floor + 1), key: `${d.at}-${d.to}` };
    floor = Math.max(floor, d.to);
    return card;
  });

  const key = (d: Drop) => `${d.at}-${d.to}`;
  const others = (d: Drop) => all.filter((x) => key(x) !== key(d));

  const saveLiveNow = (n: number) =>
    send({ override: Math.max(1, Math.min(total, n)) }, `${span(1, n)} live now.`);

  const saveDrop = (d: Drop, value: string, to: number) => {
    const at = new Date(value);
    if (!value || !Number.isFinite(at.getTime())) {
      setMsg({ kind: "err", text: "Pick a date and time first." });
      return;
    }
    send(
      { drops: [...others(d), { at: at.toISOString(), to }] },
      `Set — chapters through ${to} go live ${when(at.toISOString())}.`,
    );
  };

  const stop = (d: Drop) => send({ drops: others(d) }, `Release cancelled — chapters through ${d.to} stay locked.`);

  const addDrop = () => {
    const at = new Date(slot);
    if (!slot || !Number.isFinite(at.getTime())) {
      setMsg({ kind: "err", text: "Pick a date and time first." });
      return;
    }
    if (at.getTime() <= Date.now()) {
      setMsg({ kind: "err", text: "That time has already passed." });
      return;
    }
    send(
      { drops: [...all, { at: at.toISOString(), to: slotTo }] },
      `Scheduled — chapters through ${slotTo} go live ${when(at.toISOString())}.`,
    );
  };

  const openEdit = (id: string, at: string | null, to: number) => {
    setEditing(id);
    setSlot(at ? localSlot(at) : defaultSlot());
    setSlotTo(to);
  };

  /* a drop can't open fewer chapters than are already live, and the
     picker for one drop shouldn't reach past the next drop's floor */
  const choices = (min: number) =>
    Array.from({ length: total - min + 1 }, (_, i) => min + i);

  return (
    <main className="dash">
      <header className="dashHead">
        <h1>Chapter releases</h1>
        <a className="dashLink" href="/" target="_blank" rel="noreferrer">
          Read the book ↗
        </a>
      </header>

      {msg && <div className={`dashMsg ${msg.kind}`}>{msg.text}</div>}

      <section className="dashCard">
        <div className="dashDrop">
          <div>
            <p className="dashStatus">{unlocked === 1 ? "Chapter 1 is live." : `Chapters 1–${unlocked} are live.`}</p>
            <p className="dashMuted dashNext">
              {unlocked >= total
                ? "That's the whole book."
                : cards.length > 0
                  ? `${span(cards[0].from, cards[0].to)} go live on their own — no need to be here.`
                  : "Nothing else drops until you schedule it."}
            </p>
          </div>
          <button className="dashBtn" disabled={busy} onClick={() => openEdit("live", null, unlocked)}>
            Edit
          </button>
        </div>

        {editing === "live" && (
          <div className="dashRow">
            <label>
              Chapters live right now
              <select className="dashInput" value={slotTo} onChange={(e) => setSlotTo(Number(e.target.value))}>
                {choices(1).map((n) => (
                  <option key={n} value={n}>
                    1–{n}
                  </option>
                ))}
              </select>
            </label>
            <button className="dashBtn primary" disabled={busy} onClick={() => saveLiveNow(slotTo)}>
              Save
            </button>
            <button className="dashBtn" disabled={busy} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        )}
      </section>

      {cards.map((c) => (
        <section className="dashCard" key={c.key}>
          <div className="dashDrop">
            <div>
              <p className="dashStatus">
                {span(c.from, c.to)} in {countdown(c.at, now)}
              </p>
              <p className="dashMuted dashNext">{when(c.at)}</p>
            </div>
            <span className="dashItemActions">
              <button className="dashBtn" disabled={busy} onClick={() => openEdit(c.key, c.at, c.to)}>
                Edit
              </button>
              <button className="dashBtn" disabled={busy} onClick={() => stop(c)}>
                Stop release
              </button>
            </span>
          </div>

          {editing === c.key && (
            <div className="dashRow">
              <label>
                Live through chapter
                <select className="dashInput" value={slotTo} onChange={(e) => setSlotTo(Number(e.target.value))}>
                  {choices(c.from).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date and time
                <input
                  className="dashInput"
                  type="datetime-local"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                />
              </label>
              <button className="dashBtn primary" disabled={busy} onClick={() => saveDrop(c, slot, slotTo)}>
                Save
              </button>
              <button className="dashBtn" disabled={busy} onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          )}

          <p className="dashMuted dashNext dashQuote">
            The book tells readers: “{teaserLine(chapters[c.from - 1]?.roman ?? String(c.from), c.at, new Date(now))}.”
          </p>
        </section>
      ))}

      <section className="dashCard">
        {editing === "new" ? (
          <div className="dashRow">
            <label>
              Live through chapter
              <select className="dashInput" value={slotTo} onChange={(e) => setSlotTo(Number(e.target.value))}>
                {choices(Math.min(total, floor + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date and time
              <input
                className="dashInput"
                type="datetime-local"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
              />
            </label>
            <button className="dashBtn primary" disabled={busy} onClick={addDrop}>
              Schedule
            </button>
            <button className="dashBtn" disabled={busy} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="dashLink dashLinkBtn"
            disabled={busy || floor >= total}
            onClick={() => openEdit("new", null, Math.min(total, floor + 1))}
          >
            Schedule another drop
          </button>
        )}
      </section>
    </main>
  );
}
