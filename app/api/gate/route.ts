import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { computeGate, UNLOCK_START, TOTAL_CHAPTERS } from "@/lib/gate";

/* THE GATE, live (owner, 2026-08-13: "should be a button"). State
   lives in Vercel Edge Config so the /schedule dashboard can change
   it at runtime — no deploys. GET is CDN-cached for 60s; the reader
   falls back to the static schedule if this route is unreachable. */

export const dynamic = "force-dynamic";

async function readConfig() {
  try {
    const [start, override] = await Promise.all([
      get<string>("start"),
      get<number | null>("override"),
    ]);
    return {
      start: typeof start === "string" ? start : UNLOCK_START,
      override: typeof override === "number" ? override : null,
    };
  } catch {
    // no Edge Config (local dev without env, or outage): static schedule
    return { start: UNLOCK_START, override: null };
  }
}

export async function GET() {
  const cfg = await readConfig();
  const gate = computeGate(cfg.start, cfg.override);
  return NextResponse.json(
    { ...cfg, ...gate, total: TOTAL_CHAPTERS },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  if (!process.env.GATE_ADMIN_KEY || body.passcode !== process.env.GATE_ADMIN_KEY) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const items: { operation: "upsert"; key: string; value: string | number | null }[] = [];
  if (typeof body.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.start)) {
    items.push({ operation: "upsert", key: "start", value: body.start });
  }
  if (
    body.override === null ||
    (typeof body.override === "number" && body.override >= 1 && body.override <= TOTAL_CHAPTERS)
  ) {
    items.push({ operation: "upsert", key: "override", value: body.override as number | null });
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
  const prev = await readConfig();
  const next = {
    start: (items.find((i) => i.key === "start")?.value as string | undefined) ?? prev.start,
    override: items.some((i) => i.key === "override")
      ? (items.find((i) => i.key === "override")!.value as number | null)
      : prev.override,
  };
  return NextResponse.json({ ...next, ...computeGate(next.start, next.override), total: TOTAL_CHAPTERS });
}
