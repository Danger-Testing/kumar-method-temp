"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Book from "@/components/Book";

const Intro3D = dynamic(() => import("@/components/Intro3D"), { ssr: false });

export default function Experience() {
  const [phase, setPhase] = useState<"intro" | "book">("intro");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("book");
    }
  }, []);

  if (phase === "intro") {
    return <Intro3D onDone={() => setPhase("book")} />;
  }
  return <Book />;
}
