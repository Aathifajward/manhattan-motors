"use client";

import { ReactNode, useEffect, useRef } from "react";

/* ── Light scroll polish for the content pages ─────────────────────────────
   Not the scroll film. Each block rises 24px and fades in once, the first
   time it crosses into view, on a plain IntersectionObserver — no rAF loop,
   no scrubbing. Transform and opacity only.

   Content is in the HTML from the first byte; only its paint is deferred.
   Three things make sure it can never get stuck invisible: reduced motion
   shows everything immediately, a missing IntersectionObserver shows
   everything immediately, and if the observer somehow never reports, a
   safety timer shows everything anyway.                                   */

const DISTANCE = 24; // px
const DURATION = 700; // ms
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Only used if the observer never calls back at all. */
const SAFETY_MS = 1500;

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Shared by the component and the list hook below. */
function revealOnEnter(el: HTMLElement, delay: number) {
  const reduced = prefersReducedMotion();

  const show = () => {
    el.style.transition = reduced
      ? "none"
      : `opacity ${DURATION}ms ${EASE} ${delay}ms, transform ${DURATION}ms ${EASE} ${delay}ms`;
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  };

  if (reduced || typeof IntersectionObserver !== "function") {
    show();
    return () => {};
  }

  let done = false;
  let reported = false;

  const finish = () => {
    if (done) return;
    done = true;
    io.disconnect();
    window.clearTimeout(timer);
    show();
  };

  const io = new IntersectionObserver(
    (entries) => {
      reported = true;
      if (entries.some((e) => e.isIntersecting)) finish();
    },
    // A touch early, so a block is already settled by the time it is read.
    { threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);

  const timer = window.setTimeout(() => {
    if (!reported) finish();
  }, SAFETY_MS);

  return () => {
    io.disconnect();
    window.clearTimeout(timer);
  };
}

/** The state a block ships in. Spread into `style` for a hand-rolled element. */
export const hidden = {
  opacity: 0,
  transform: `translateY(${DISTANCE}px)`,
  willChange: "opacity, transform",
} as const;

export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  style,
}: {
  children: ReactNode;
  /** Milliseconds behind the block's own entry — this is the stagger. */
  delay?: number;
  /** So a revealed block can still be the landmark it ought to be. */
  as?: "div" | "section" | "header" | "li" | "article";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return revealOnEnter(el, delay);
  }, [delay]);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={className}
      style={{ ...hidden, ...style }}
    >
      {children}
    </Tag>
  );
}

/**
 * For a list whose items are their own elements — table rows, cards, fields.
 * Collect the refs into the array this returns, and each item rises `step`
 * milliseconds after the one before it as the group comes into view.
 */
export function useRevealList(count: number, step = 50) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const cleanups = refs.current
      .slice(0, count)
      .map((el, i) => (el ? revealOnEnter(el, i * step) : null))
      .filter(Boolean) as Array<() => void>;
    return () => cleanups.forEach((fn) => fn());
  }, [count, step]);

  return refs;
}

/**
 * A few pixels of drift on a large image as it passes. Deliberately small —
 * it should read as depth, not as movement. Transform only, one rAF, and it
 * does nothing at all under reduced motion.
 */
export function useParallax(
  ref: React.RefObject<HTMLElement | null>,
  distance = 14
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let rafId = 0;
    let disposed = false;

    const tick = () => {
      rafId = 0;
      if (disposed) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 below the fold, 0 centred, 1 above it.
      const centred = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, centred));
      el.style.transform = `translate3d(0, ${(-distance * clamped).toFixed(2)}px, 0)`;
    };

    const kick = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
    };
  }, [ref, distance]);
}
