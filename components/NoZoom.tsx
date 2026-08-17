"use client";

import { useEffect } from "react";

/* Zoom lock (owner, 2026-08-17). The viewport meta stops Android and
   double-tap zoom, but iOS Safari has ignored user-scalable=no since
   iOS 10 — pinch and the double-tap gesture still fire there, and on
   this site they wreck the 3D scene's framing. These listeners cover
   Safari's own gesture events plus multi-touch pinch. */
export default function NoZoom() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    // Safari's proprietary pinch events
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    document.addEventListener("gestureend", stop);
    // two-finger pinch on any browser that reports it as touches
    const pinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", pinch, { passive: false });
    // double-tap-to-zoom (belt and braces alongside touch-action)
    let last = 0;
    const dbl = (e: TouchEvent) => {
      const now = e.timeStamp;
      if (now - last < 320) e.preventDefault();
      last = now;
    };
    document.addEventListener("touchend", dbl, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("gestureend", stop);
      document.removeEventListener("touchmove", pinch);
      document.removeEventListener("touchend", dbl);
    };
  }, []);
  return null;
}
