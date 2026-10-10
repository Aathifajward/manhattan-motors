"use client";

import type { RefObject } from "react";

/**
 * Scroll progress for a pinned stage: a hairline 24px off the bottom edge,
 * growing left to right with the card's own progress. Desktop only.
 */
export default function ProgressLine({
  lineRef,
}: {
  lineRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-6 bottom-[24px] z-40 hidden h-px md:block"
      style={{ background: "rgba(255,255,255,0.4)" }}
    >
      <div
        ref={lineRef}
        className="h-px w-full origin-left bg-white will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
