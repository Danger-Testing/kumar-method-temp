import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* The retired marclosbranch preview kept circulating (and kept showing
   stale code — the owner hit old illustrations there, 2026-08-13).
   That host now bounces to production. Deployed on the branch itself:
   push main to marclosbranch once and the old URL redirects forever.
   Production and other hosts pass straight through. */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("plain-rules-git-marclosbranch")) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://plain-rules.vercel.app");
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}
