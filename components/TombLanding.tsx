"use client";

import { useEffect } from "react";
import TombScene from "@/components/TombScene";

/* The homepage: Marc's tomb landing exactly as it is on his tomb
   branch. Clicking the tomb doorway wakes the book. */
export default function TombLanding({ onWake }: { onWake: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onWake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onWake]);

  return (
    <main className="km-site">
      <div className="km-transition-stage km-transition-landing">
        <TombScene onWake={onWake} />
      </div>
    </main>
  );
}
