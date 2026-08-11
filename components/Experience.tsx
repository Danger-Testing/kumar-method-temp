"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";
import TombLanding from "@/components/TombLanding";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });

export default function Experience() {
  const [phase, setPhase] = useState<"tomb" | "intro" | "book">("tomb");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("book");
    }
  }, []);

  if (phase === "tomb") {
    return <TombLanding onWake={() => setPhase("intro")} />;
  }

  if (phase === "intro") {
    return (
      <Intro3D
        emerge
        onDone={(finished) => {
          setFlash(finished);
          setPhase("book");
        }}
      />
    );
  }

  return (
    <>
      <Book />
      {/* the page emerges out of the golden flash the dolly ended on */}
      {flash && (
        <div className="handoffFlash" onAnimationEnd={() => setFlash(false)}>
          <div className="rampLogo" aria-label="ramp" />
        </div>
      )}
    </>
  );
}
