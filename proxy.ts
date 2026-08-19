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
  /* THE DASHBOARD IS UNLISTED (owner, 2026-08-18). /schedule only
     exists for someone holding the secret link, and the secret lives
     ONLY in the Vercel env var DASH_SLUG — never in this repo, which
     is public and which the Ramp team deploys themselves. No DASH_SLUG
     on a deployment (a fresh clone, Ramp's build) => the path 404s for
     everyone, which is the safe direction to fail.

     First visit: /schedule?k=<DASH_SLUG> trades the secret for an
     httpOnly cookie and drops it from the address bar. The write side
     (POST /api/gate) still needs the GATE_ADMIN_KEY passcode on top. */
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/schedule" || pathname.startsWith("/schedule/")) {
    const slug = process.env.DASH_SLUG;
    if (!slug) return notFound();

    if (searchParams.get("k") === slug) {
      const res = NextResponse.redirect(new URL("/schedule", request.url), 307);
      res.cookies.set("dash", slug, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    if (request.cookies.get("dash")?.value !== slug) return notFound();
  }

  /* ?chapters=N WAS A PUBLIC BACKDOOR (found 2026-08-18): Book.tsx
     honors it for anyone, so a guessed "/?chapters=10" read the whole
     book past the gate. On the hosts where that matters it is now
     stripped unless the request carries the dashboard cookie — the
     reader's code is untouched, so a team browser that has opened the
     secret dashboard link still previews any gate state.

     PRODUCTION HOSTS ONLY, on purpose: previews are where this book
     gets reviewed (the owner reads illustrations on a *.vercel.app
     preview with ?chapters=10, and previews have no Edge Config), so
     stripping the param there would break the review, not a leak. */
  const publicHost = host === "plain-rules.vercel.app" || host.endsWith("ramp.com");
  if (publicHost && searchParams.has("chapters") && request.cookies.get("dash")?.value !== process.env.DASH_SLUG) {
    const clean = new URL(request.nextUrl.pathname, request.url);
    searchParams.forEach((value, key) => {
      if (key !== "chapters") clean.searchParams.set(key, value);
    });
    return NextResponse.redirect(clean, 307);
  }

  return NextResponse.next();
}

/* a bare 404 — no redirect, no login screen, nothing that hints the
   route is real */
function notFound() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
