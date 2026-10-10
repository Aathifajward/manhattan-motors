"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ProgressLine from "./scroll/ProgressLine";
import { OUTRO_DIM, OUTRO_RISE_VH, SLIDE, STAGE } from "./scroll/stacked";

/* ── Timeline ──────────────────────────────────────────────────────────────
   The card is 800vh with a 100vh stage, so 700vh of scroll. Location is pulled
   up by -200vh, which puts its first frame 600vh in — so the whole car pass has
   to be done by then and the outro runs across the last 100vh. There is no idle
   stretch: the moment the cars finish is the moment Location starts rising.  */

const CARD_VH = 800;
const SCROLLABLE_VH = CARD_VH - STAGE;          // 700
/** Where Location begins to cover this card. */
const COVER_START = (SCROLLABLE_VH - SLIDE) / SCROLLABLE_VH; // 600/700

/* Everything below is measured against `drive` — this card's own progress
   renormalised so 1.0 lands exactly on COVER_START. */

/** The GTR runs the whole pass; it leads, the Velfires are a little quicker. */
const LEFT_START = 0.154;
const LEFT_END = 0.923;
const RIGHT_START = 0.256;
const RIGHT_END = 0.962;

/** "Your next / drive" is carried up and off while the cars cover it. */
const HEAD_START = 0.256;
const HEAD_END = 0.769;

/** The closing line keeps rising once the card starts being covered. */
const OUTRO_TEXT_VH = 15; // on top of the stage's own -15vh drift = -30vh

/**
 * Measured against the GTR's own progress, not the section's. The wrapper is
 * roughly twice the stage height, so the rear bumper only clears the bottom of
 * the viewport around g = 0.65 — the copy has to emerge after that or it would
 * be pushed out below the fold where nobody sees it.
 */
const EMERGE_FROM = 0.66;
const EMERGE_TO = 0.8;

/**
 * Where the GTR's rear bumper sits inside its wrapper. The art is 810x1599 in
 * an aspect-[1/2] box, so `object-contain` fits it by width and leaves a hair
 * of letterbox: the image bottom lands at 99.35% of the wrapper height. That
 * line is the edge the copy slides out from under.
 */
const REAR_EDGE = 0.9935;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

export default function DriveEnd() {
  const t = useTranslations("DriveEnd");

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const gtrWrapperRef = useRef<HTMLDivElement>(null);
  const velfireLeftRef = useRef<HTMLDivElement>(null);
  const velfireRightRef = useRef<HTMLDivElement>(null);

  const driftRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const startTextRef = useRef<HTMLDivElement>(null);
  /** Clipped box riding under the GTR's rear; later parks at stage centre. */
  const endClipRef = useRef<HTMLDivElement>(null);
  /** The copy itself, pushed down out of that box. */
  const endTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    // Cached so the frame loop does no layout reads.
    let wh = 1;
    let gtrH = 0;
    let leftH = 0;
    let rightH = 0;
    let headH = 0;
    let endH = 0;
    const measure = () => {
      wh = window.innerHeight || 1;
      gtrH = gtrWrapperRef.current?.offsetHeight ?? 0;
      leftH = velfireLeftRef.current?.offsetHeight ?? 0;
      rightH = velfireRightRef.current?.offsetHeight ?? 0;
      headH = startTextRef.current?.offsetHeight ?? 0;
      endH = endClipRef.current?.offsetHeight ?? 0;
    };
    measure();

    /** One source of truth for every layer, so the reduced-motion end state
     *  is exactly the frame the animation would have finished on. */
    const apply = (progress: number) => {
      // Renormalised so the car pass fills everything before the cover.
      const drive = clamp01(progress / COVER_START);
      const outro = span(progress, COVER_START, 1);

      // The GTR, and with it the clipped box holding the copy.
      const gProg = drive;
      const gtrY = wh - gProg * (wh + gtrH);
      if (gtrWrapperRef.current) {
        gtrWrapperRef.current.style.transform = `translate3d(0, ${gtrY.toFixed(2)}px, 0)`;
      }

      // The copy slides down out from behind the rear bumper. Its box clips
      // everything above that line, so only what has emerged is visible.
      if (endTextRef.current) {
        const emerge = span(gProg, EMERGE_FROM, EMERGE_TO);
        endTextRef.current.style.transform =
          `translate3d(0, ${(-100 * (1 - emerge)).toFixed(3)}%, 0)`;
      }

      // The box tracks the rear bumper all the way up, then simply stops at
      // the centre of the stage and lets the car drive on without it. Clamping
      // rather than cross-fading keeps the motion monotonic — no drift back.
      if (endClipRef.current) {
        const attachedY = gtrY + gtrH * REAR_EDGE; // the rear bumper line
        const parkedY = wh / 2 - endH / 2;
        // Once covered it carries on up with the scroll instead of sitting still.
        const lift = (OUTRO_TEXT_VH * wh) / 100 * outro;
        const offset = Math.max(attachedY, parkedY) - attachedY - lift;
        endClipRef.current.style.transform = `translate3d(-50%, ${offset.toFixed(2)}px, 0)`;
      }

      // Velfires — their own, slightly quicker passes.
      if (velfireLeftRef.current) {
        const p = span(drive, LEFT_START, LEFT_END);
        velfireLeftRef.current.style.transform =
          `translate3d(-50%, ${(wh - p * (wh + leftH)).toFixed(2)}px, 0)`;
      }
      if (velfireRightRef.current) {
        const p = span(drive, RIGHT_START, RIGHT_END);
        velfireRightRef.current.style.transform =
          `translate3d(50%, ${(wh - p * (wh + rightH)).toFixed(2)}px, 0)`;
      }

      // "Your next / drive" is carried off the top — translate only, no fade.
      if (startTextRef.current) {
        const p = span(drive, HEAD_START, HEAD_END);
        const travel = wh * 0.35 + headH + 40; // clears the top of the stage
        startTextRef.current.style.transform = `translate3d(0, ${(-p * travel).toFixed(2)}px, 0)`;
      }

      // Being covered by Location: the whole stage drifts up and darkens.
      if (driftRef.current) {
        driftRef.current.style.transform = `translate3d(0, ${(-OUTRO_RISE_VH * outro).toFixed(3)}vh, 0)`;
      }
      if (dimRef.current) dimRef.current.style.opacity = (OUTRO_DIM * outro).toFixed(4);
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      apply(1); // the finished frame, no loop
      return;
    }

    let disposed = false;
    let rafId = 0;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
      apply(progress);

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

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[var(--mm-navy)]"
      style={{ height: `${CARD_VH}vh`, zIndex: 20 }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex justify-center bg-[var(--mm-navy)]">
        <div ref={driftRef} className="absolute inset-0 will-change-transform">

        {/* "Your next / drive" — behind the cars, carried off the top */}
        <div className="absolute inset-0 flex flex-col items-center text-center px-6 z-10 pointer-events-none">
          <div
            ref={startTextRef}
            className="absolute w-full flex flex-col items-center justify-center will-change-transform"
            style={{ top: "35%" }}
          >
            <h2 className="font-heading text-white leading-[1.1]" style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>
              <span className="block">{t("headline1a")}</span>
              {t("headline1b") && <span className="block">{t("headline1b")}</span>}
            </h2>
          </div>
        </div>

        {/* Cars — in front of that headline */}
        <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none z-20">

          {/* Left Velfire */}
          <div
            ref={velfireLeftRef}
            className="absolute left-0 top-0 w-[90vw] md:w-[45vw] aspect-[1/2] will-change-transform"
            style={{ transform: "translate3d(-50%, 0, 0)" }}
          >
            <Image
              src="/images/velfire-trimmed.png"
              alt=""
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              className="object-contain"
              loading="eager"
            />
          </div>

          {/* Right Velfire */}
          <div
            ref={velfireRightRef}
            className="absolute right-0 top-0 w-[90vw] md:w-[45vw] aspect-[1/2] will-change-transform"
            style={{ transform: "translate3d(50%, 0, 0)" }}
          >
            <Image
              src="/images/velfire-trimmed.png"
              alt=""
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              className="object-contain"
              loading="eager"
            />
          </div>

          {/* GTR, carrying the copy out from under its rear */}
          <div
            ref={gtrWrapperRef}
            className="absolute top-0 w-[90vw] md:w-[42vw] aspect-[1/2] will-change-transform"
          >
            {/* Clip box: its top edge IS the rear bumper line, so the copy is
                invisible until the car pushes it out below. Sits under the car. */}
            <div
              ref={endClipRef}
              className="absolute w-[100vw] overflow-hidden z-0"
              style={{ top: `${REAR_EDGE * 100}%`, left: "50%", transform: "translate3d(-50%, 0, 0)" }}
            >
              <div
                ref={endTextRef}
                className="flex flex-col items-center justify-center text-center will-change-transform"
                style={{ transform: "translate3d(0, -100%, 0)" }}
              >
                <h2 className="font-heading text-white leading-tight whitespace-nowrap" style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>
                  {t("headline2")}
                </h2>
              </div>
            </div>

            {/* The car itself, above the copy */}
            <div className="relative w-full h-full z-10">
              <Image
                src="/images/gtr-trimmed.png"
                alt=""
                fill
                sizes="(max-width: 768px) 90vw, 42vw"
                className="object-contain"
                loading="eager"
              />
            </div>
          </div>

        </div>
        </div>

        {/* Darkens while Location rises over this card */}
        <div
          ref={dimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-black"
          style={{ opacity: 0 }}
        />

        <ProgressLine lineRef={lineRef} />
      </div>
    </section>
  );
}
