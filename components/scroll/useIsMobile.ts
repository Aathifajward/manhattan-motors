"use client";

import { useSyncExternalStore } from "react";

/**
 * The one breakpoint the scroll film branches on — Tailwind's `md`, so a
 * component's JS branch and its `md:` classes always flip on the same pixel.
 */
export const MOBILE_MAX_PX = 767;
const QUERY = `(max-width: ${MOBILE_MAX_PX}px)`;

const matches = () =>
  typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : window.innerWidth <= MOBILE_MAX_PX;

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") {
    window.addEventListener("resize", onChange, { passive: true });
    return () => window.removeEventListener("resize", onChange);
  }
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** The server has no viewport, and says so rather than guessing. */
const onServer = () => null;

/**
 * `null` through the server render and the hydration that matches it, the real
 * answer from the first client frame onwards. Callers that need a boolean
 * should read `null` as desktop, so what is painted first is what the server
 * sent.
 *
 * This is deliberately the exception: everything that can be said in CSS is
 * said in CSS (`md:` / `max-md:` classes, a media query in globals.css),
 * because that needs no hydration and cannot flash. Reach for this only for
 * what a media query cannot express — a section height the scroll maths reads
 * back, or a whole animation branch.
 */
export function useIsMobile(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, matches, onServer);
}
