"use client";

/* Kendall's legal line (2026-08-13): a compact block of faded ink in
   the dark at the bottom of EVERY screen — the reader (Book) and the
   held book (Intro3D: launch hold + dismissed state). */
export default function LegalLine({ className = "" }: { className?: string }) {
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div className={`pageLegal ${className}`}>
      © 2026 Ramp Business Corporation. &ldquo;Ramp&rdquo; and the Ramp logo are registered trademarks of the
      company.{" "}
      <a
        href="https://ramp.com/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        onPointerDown={stop}
        onPointerUp={stop}
      >
        Privacy Policy
      </a>
    </div>
  );
}
