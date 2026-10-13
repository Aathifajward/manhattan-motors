"use client";

import { useEffect } from "react";

import { onViewportChange } from "./viewport";

/**
 * Shared geometry for the stacked cards (VehicleSlides -> DriveEnd ->
 * Location). Each card is a tall scroll container with a sticky stage; the next
 * card slides up over it while it stays pinned, then the pin releases exactly
 * as the cover completes — so there is never an idle frame between them.
 *
 * All the values below are vh — they are scroll *length*, and scroll length
 * has to stay still. The stages those cards pin are `dvh` instead, so they
 * always fill exactly what the phone is showing; see the note in globals.css.
 *
 *   |<- STAGE ->|<- SLIDE ->|<- HOLD ->|<- COVER ->|
 *                ^ rises over          ^ the next card rises over this one
 *                  the card before       while this one is still pinned
 *
 * A card's own SLIDE is consumed from the previous card's COVER, which is why
 * MARGIN is -(STAGE + SLIDE): it starts exactly SLIDE before the previous
 * card unpins.
 *
 * Location is the end of the chain: nothing covers it, and Sell and the footer
 * after it are plain sections that scroll normally.
 */
export const STAGE = 100;
export const SLIDE = 100;
export const HOLD = 60;
export const COVER = SLIDE; // the next card's slide is this card's cover

/**
 * Height of the last card, which nothing covers. It keeps its HOLD so its copy
 * can finish landing before the pin releases.
 */
export const LAST_CARD_VH = STAGE + SLIDE + HOLD; // 260
/** Pulls a card up so it starts rising before the one before it unpins. */
export const CARD_MARGIN_VH = -(STAGE + SLIDE); // -200

const scrollableOf = (heightVh: number) => heightVh - STAGE;

/** Progress at which a card has finished rising into place. */
export const slideEnd = (heightVh: number) => SLIDE / scrollableOf(heightVh);
/** Progress at which the next card starts covering this one. */
export const coverStart = (heightVh: number) =>
  (scrollableOf(heightVh) - COVER) / scrollableOf(heightVh);

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

/* ── Pacing ───────────────────────────────────────────────────────────────
   Each of these maps a 0..1 progress to a 0..1 progress with both ends
   pinned, so a section's first and last frames are exactly what they were —
   only the speed between them changes. They are applied to the local
   progress a visual reads, never to the scroll measurement itself, which
   stays a straight line from scroll position to progress.

   The point is that the page should not be evenly paced: the hero and the
   word reveal breathe, the panels and the slide changes snap.           */

/** Slow away, slow into the stop. The cinematic one. */
export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** Quick off the mark, settling at the end. */
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

/** The same shape with more snap in it. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Front-loads the motion when `power` is below 1 — most of the travel
 *  happens early in the range, which is what makes a change read as fast
 *  without shortening the scroll it occupies. */
export const easeOutPow = (t: number, power: number) => Math.pow(t, power);

/** The original name, kept for call sites that already use it. */
export const easeOut = easeOutCubic;

/**
 * One rAF loop per card, refs only, no layout reads inside the frame: the
 * section's position and scroll length are cached on mount and re-taken on
 * every viewport change, which on a phone includes the address bar moving.
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
    // The stage is `dvh`, so a phone's address bar retracting changes both how
    // tall it is and how much scroll is left — and that does not always arrive
    // as a window resize. See components/scroll/viewport.ts.
    const offViewport = onViewportChange(onResize);

    // Nor is a viewport change the only thing that moves a card. The stack is
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
      offViewport();
      window.removeEventListener("scroll", kick);
    };
    // `apply` is a stable closure over refs in every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef, stageRef, settled]);
}
