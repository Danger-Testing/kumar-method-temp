import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import {
  applyDrops,
  computeGate,
  daysUntil,
  normalizeDrops,
  pendingDrops,
  TOTAL_CHAPTERS,
  UNLOCK_START,
  type Drop,
} from "@/lib/gate";

/* THE GATE, live (owner, 2026-08-13: "should be a button"). State
   lives in Vercel Edge Config so the /schedule dashboard can change
   it at runtime — no deploys. GET is CDN-cached for 60s; the reader
   falls back to the static schedule if this route is unreachable.

   Three keys: `start` (the old day-per-chapter calendar, still the
   offline fallback), `override` (a manual chapter count) and `drops`
   (timed releases — see lib/gate.ts). Drops are applied when this
   route is READ, so a release needs no cron and cannot fail to fire.

   WRITES need the dashboard's httpOnly `dash` cookie, which only
   /schedule?k=<DASH_SLUG> hands out (owner, 2026-08-18: "if this is a
   truly secret url u dont need to password gate?"). One secret, and
   with SameSite=Lax another site can't make a browser POST here. No
   DASH_SLUG on the deployment => nobody can write at all. */

export const dynamic = "force-dynamic";

async function readConfig() {
  try {
    const [start, override, drops] = await Promise.all([
      get<string>("start"),
      get<number | null>("override"),
      get<unknown>("drops"),
    ]);
    return {
      start: typeof start === "string" ? start : UNLOCK_START,
      override: typeof override === "number" ? override : null,
      drops: normalizeDrops(drops),
    };
  } catch {
    // no Edge Config (local dev without env, or outage): static schedule
    return { start: UNLOCK_START, override: null, drops: [] as Drop[] };
  }
}

/** the full picture: manual state, then any drop that has already fired */
function resolve(cfg: { start: string; override: number | null; drops: Drop[] }) {
  const manual = computeGate(cfg.start, cfg.override);
  const dropped = applyDrops(manual.unlocked, cfg.drops);
  return {
    ...cfg,
    unlocked: dropped.unlocked,
    nextDropAt: dropped.nextDropAt,
    nextDropTo: dropped.nextDropTo,
    // a real date beats the frozen "in 2 days" the teaser used to show
    daysToNext:
      dropped.unlocked >= TOTAL_CHAPTERS
        ? 0
        : dropped.nextDropAt
          ? daysUntil(dropped.nextDropAt)
          : manual.daysToNext,
    total: TOTAL_CHAPTERS,
  };
}

function authorized(request: Request) {
  const slug = process.env.DASH_SLUG;
  if (!slug) return false;
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(/;\s*/).includes(`dash=${slug}`);
}

export async function GET() {
  const cfg = await readConfig();
  return NextResponse.json(resolve(cfg), {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      // read cross-origin by the copy embedded at ramp.com/thekumarmethod
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  if (!authorized(request)) {
    return NextResponse.json({ error: "Open /schedule with the secret link first." }, { status: 401 });
  }

  const prev = await readConfig();
  const items: { operation: "upsert"; key: string; value: unknown }[] = [];
  const next = { ...prev };

  if (typeof body.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.start)) {
    next.start = body.start;
    items.push({ operation: "upsert", key: "start", value: body.start });
  }

  if (
    body.override === null ||
    (typeof body.override === "number" && body.override >= 1 && body.override <= TOTAL_CHAPTERS)
  ) {
    next.override = body.override as number | null;
    items.push({ operation: "upsert", key: "override", value: next.override });
    /* a hand-made change happens NOW, so it must outrank a drop that
       already fired — otherwise Hide would be undone on the next read.
       Pending drops survive untouched. */
    next.drops = pendingDrops(prev.drops);
    if (next.drops.length !== prev.drops.length) {
      items.push({ operation: "upsert", key: "drops", value: next.drops });
    }
  }

  if (Array.isArray(body.drops)) {
    next.drops = normalizeDrops(body.drops).slice(0, 12);
    items.push({ operation: "upsert", key: "drops", value: next.drops });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items?teamId=${process.env.VERCEL_TEAM_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    },
  );
  if (!res.ok) {
    return NextResponse.json({ error: `Edge Config write failed (${res.status}).` }, { status: 502 });
  }

  // answer from the values just written — edge propagation can lag a beat
  return NextResponse.json(resolve(next));
}
