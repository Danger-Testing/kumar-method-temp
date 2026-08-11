"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });

export default function Experience() {
  const [phase, setPhase] = useState<"intro" | "book">("intro");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("book");
    }
  }, []);

  if (phase === "intro") {
    return (
      <Intro3D
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
      {flash && <div className="handoffFlash" onAnimationEnd={() => setFlash(false)} />}
    </>
  );
}
