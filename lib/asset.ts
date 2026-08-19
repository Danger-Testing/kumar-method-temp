/* PUBLIC ASSETS INSIDE THE RAMP EMBED (verified 2026-08-18).

   ramp.com serves this app as a Vercel microfrontend zone mounted at
   /thekumarmethod, and the platform rewrites only SOME of our asset
   references with that prefix. The stylesheet it serves asks for
   /thekumarmethod/paper/vintage.jpg — rewritten, works — but the JS
   bundle it serves still asks for /illustrations/lesson-0-0.png, and
   ramp.com/illustrations/... is a 404 from Ramp's marketing site while
   ramp.com/thekumarmethod/illustrations/... is our file. next/image is
   fine too (its optimizer URL gets the prefix), so what's left broken
   is exactly the assets named by string literals in JS: the lesson
   drawings, the two smoke videos, the 3D covers and the book mesh.
   None of them have ever loaded inside the embed.

   Off ramp.com this is the identity function, so nothing that already
   works anywhere else can change. */

export const EMBED_BASE = "/thekumarmethod";

/** "" everywhere but inside the ramp.com embed */
export function assetBase(): string {
  if (typeof window === "undefined") return "";
  return /(^|\.)ramp\.com$/i.test(window.location.hostname) ? EMBED_BASE : "";
}

export function asset(path: string): string {
  return assetBase() + path;
}
