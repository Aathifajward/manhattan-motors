"use client";

import { useEffect } from "react";

/**
 * Shared geometry for the stacked-card closers (DriveEnd → Location → Sell →
 * Footer). Each card is a tall scroll container with a sticky stage; the next
 * card slides up over it while it stays pinned, then the pin releases exactly
 * as the cover completes — so there is never an idle frame between them.
 *
 * All values are vh.
 *
 *   |<- STAGE ->|<- SLIDE ->|<- HOLD ->|<- COVER ->|
 *                ^ rises over          ^ the next card rises over this one
 *                  the card before       while this one is still pinned
 *
 * A card's own SLIDE is consumed from the previous card's COVER, which is why
 * MARGIN is -(STAGE + SLIDE): it starts exactly SLIDE before the previous
 * card unpins.
 */
export const STAGE = 100;
export const SLIDE = 100;
export const HOLD = 60;
export const COVER = SLIDE; // the next card's slide is this card's cover

/** Height of a card that gets covered by another one. */
export const CARD_VH = STAGE + SLIDE + HOLD + COVER; // 360
/** Height of the last card, which nothing covers. */
export const LAST_CARD_VH = STAGE + SLIDE; // 200
/** Pulls a card up so it starts rising before the one before it unpins. */
export const CARD_MARGIN_VH = -(STAGE + SLIDE); // -200

const scrollableOf = (heightVh: number) => heightVh - STAGE;

/** Progress at which a card has finished rising into place. */
export const slideEnd = (heightVh = CARD_VH) => SLIDE / scrollableOf(heightVh);
/** Progress at which the next card starts covering this one. */
export const coverStart = (heightVh = CARD_VH) =>
  (SLIDE + HOLD) / scrollableOf(heightVh);

/** How far the outgoing content drifts up while it is being covered. */
export const OUTRO_RISE_VH = 15;
/** How dark it goes under the incoming card. */
export const OUTRO_DIM = 0.5;

/** Scrubbed copy reveal: rises this far while its opacity climbs from DIM to 1. */
export const TEXT_RISE_PX = 60;
export const TEXT_DIM = 0.25;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const span = (p: number, from: number, to: number) =>
  clamp01((p - from) / (to - from));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * One rAF loop per card, refs only, no layout reads inside the frame: the
 * section's position and scroll length are cached on mount and on resize.
 *
 * `settled` is the frame shown under prefers-reduced-motion — normally the
 * point where the card has arrived but is not yet being covered.
 */
export function useStackProgress(
  sectionRef: React.RefObject<HTMLElement | null>,
  stageRef: React.RefObject<HTMLElement | null>,
  apply: (progress: number, entry: number) => void,
  settled = 0.5
) {
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let top = 0;
    let scrollable = 1;
    let vh = 1;
    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      scrollable = Math.max(1, section.offsetHeight - stage.offsetHeight);
      vh = window.innerHeight || 1;
    };
    measure();

    /** 0 when the section's top sits at the viewport bottom, 1 once it reaches
     *  the top — i.e. how far the stage has entered, before it pins. */
    const entryOf = (y: number) => clamp01((vh - (top - y)) / vh);

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      apply(settled, 1);
      return;
    }

    let disposed = false;
    let rafId = 0;

    const tick = () => {
      rafId = 0;
      if (disposed) return;
      const y = window.scrollY;
      apply(clamp01((y - top) / scrollable), entryOf(y));
      rafId = requestAnimationFrame(tick);
    };
    tick();

    const kick = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };
    const onResize = () => {
      measure();
      kick();
    };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    // A window resize is not the only thing that moves a card. The stack is
    // built from -200vh margins, so every card's position depends on the ones
    // before it; a late font, a loaded image or any reflow shifts them all and
    // would otherwise leave the cached offsets stale and the cards out of sync.
    const ro =
      typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
    ro?.observe(document.documentElement);
    ro?.observe(section);

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
    };
    // `apply` is a stable closure over refs in every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef, stageRef, settled]);
}
