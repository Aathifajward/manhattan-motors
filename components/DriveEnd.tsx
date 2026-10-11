"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  CARD_MARGIN_VH,
  COVER,
  OUTRO_DIM,
  OUTRO_RISE_VH,
  SLIDE,
  STAGE,
  coverStart,
  easeOut,
  slideEnd,
} from "./scroll/stacked";

/* ── Timeline ──────────────────────────────────────────────────────────────
   This card is a stacked card at both ends: it rises over VehicleSlides on a
   hard edge across its first 100vh, runs the car pass for 600vh, then Location
   rises over it across the last 100vh while it stays pinned.

       |<- STAGE ->|<- SLIDE ->|<- 600vh car pass ->|<- COVER ->|

   900vh with a 100vh stage, so 800vh of scroll. There is no idle stretch at
   either end: the cars start the moment the card lands and the moment they
   finish is the moment Location starts rising.                              */

/** The road the cars drive up: a top-down strip of asphalt with the centre
 *  line running the way they travel. */
const ROAD_SRC = "/images/road2.jpeg";
/**
 * The art is already almost black — the asphalt measures 2% luma and only
 * the centre line, at 48%, is bright. So the scrim is kept light: its whole
 * job is taking the edge off that line where the headline crosses it, and
 * anything heavier would push the asphalt below the navy underneath and
 * lose the road altogether.
 */
const ROAD_SCRIM = 0.22;

/** The car pass itself — this card's HOLD, and the only part that is not
 *  geometry shared with the rest of the stack. */
const DRIVE_VH = 600;
const CARD_VH = STAGE + SLIDE + DRIVE_VH + COVER; // 900
/** Where this card has finished rising over VehicleSlides. */
const SLIDE_END = slideEnd(CARD_VH);              // 100/800
/** Where Location begins to cover this card. */
const COVER_START = coverStart(CARD_VH);          // 700/800

/* Everything below is measured against `drive` — this card's own progress
   renormalised so 0 lands on SLIDE_END and 1.0 on COVER_START. */

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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── The closing line, pulled out from under the car ───────────────────────
   Three things run together over one range: the line slides down out of a
   mask whose top edge IS the GTR's rear, it eases up from 0.82 to full size,
   and a reading edge sweeps its letters from dim grey through the accent
   blue to white — the same technique as WordReveal, one character at a time
   instead of one word. All three land on the same frame, after which the
   line simply rides along with the car.                                   */

/**
 * Measured against the GTR's own progress, not the section's. The wrapper is
 * roughly twice the stage height, so the rear bumper only clears the bottom of
 * the viewport around g = 0.65 — nothing is lit before that or the sweep would
 * burn through below the fold where nobody sees it. It finishes short of the
 * cover, so the line is fully white before Location arrives.
 */
const REVEAL_FROM = 0.66;
const REVEAL_TO = 0.95;

/** Width of the edge, in letters — how many are mid-transition at once. */
const FADE = 2;
/** Where inside one letter's transition the blue is reached and left again.
 *  The short plateau between them is what makes a letter read as properly
 *  blue rather than as a pale smear on the way to white. */
const BLUE_IN = 0.35;
const BLUE_OUT = 0.55;

/** Not yet read: white held well back. */
const DIM: [number, number, number, number] = [255, 255, 255, 0.3];
/** The site blue, at the leading edge — the same #2F8BFF WordReveal uses. */
const BLUE: [number, number, number, number] = [47, 139, 255, 1];
/** Settled, behind the edge. */
const WHITE: [number, number, number, number] = [255, 255, 255, 1];

/** Carried by the highlighted letters only, never by the whole line. */
const GLOW = "0 0 18px rgba(47,139,255,0.55)";
/** The slice of a letter's transition that carries that glow. */
const GLOW_FROM = 0.08;
const GLOW_TO = 0.88;

/** The block grows from this to 1 across the reveal, on transform alone. */
const SCALE_FROM = 0.82;
/** And slides down from this much of its own height, out of the mask. */
const SLIDE_FROM = -100; // %

/** `t` is one letter's own 0 -> 1 transition: grey at 0, blue through the
 *  middle, white once it is through. */
function letterColor(t: number) {
  const hot = clamp01(t / BLUE_IN); // grey -> blue
  const cool = clamp01((t - BLUE_OUT) / (1 - BLUE_OUT)); // blue -> white
  const ch = (i: number) => mix(mix(DIM[i], BLUE[i], hot), WHITE[i], cool);
  return `rgba(${ch(0) | 0}, ${ch(1) | 0}, ${ch(2) | 0}, ${ch(3).toFixed(3)})`;
}

/**
 * "starts here." -> ["s","t","a","r","t","s"," ","h","e","r","e."]
 * Spaces stay spaces and punctuation rides the letter before it, so the
 * period never lights on its own. `slot` is the letter's place in the sweep,
 * -1 for the spaces, which never take a turn.
 */
function splitLetters(text: string) {
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    const prev = out[out.length - 1];
    const joins =
      !/\s/.test(ch) && prev !== undefined && !/\s/.test(prev) && !/[\p{L}\p{N}]/u.test(ch);
    if (joins) out[out.length - 1] = prev + ch;
    else out.push(ch);
  }
  let slot = 0;
  return out.map((chars) => ({ chars, slot: /\s/.test(chars) ? -1 : slot++ }));
}

/**
 * Where the GTR's rear bumper sits inside its wrapper. The art is 810x1599 in
 * an aspect-[1/2] box, so `object-contain` fits it by width and leaves a hair
 * of letterbox: the image bottom lands at 99.35% of the wrapper height. That
 * line is where the closing copy sits, just below the bumper.
 */
const REAR_EDGE = 0.9935;

export default function DriveEnd() {
  const t = useTranslations("DriveEnd");

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const gtrWrapperRef = useRef<HTMLDivElement>(null);
  const velfireLeftRef = useRef<HTMLDivElement>(null);
  const velfireRightRef = useRef<HTMLDivElement>(null);

  /** The card itself, rising over VehicleSlides behind a hard top edge. */
  const slideRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  const startTextRef = useRef<HTMLDivElement>(null);
  /** Mask riding under the GTR's rear; later parks at stage centre. Its top
   *  edge is the bumper line, so anything above it is tucked under the car. */
  const endBoxRef = useRef<HTMLDivElement>(null);
  /** The line, sliding down out of that mask. */
  const endRevealRef = useRef<HTMLDivElement>(null);
  /** The line itself, growing from 0.82 about its top centre. */
  const endScaleRef = useRef<HTMLDivElement>(null);
  /** One span per letter of the closing line, indexed by sweep slot. */
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** Last values written per letter, so the loop only touches them on change. */
  const lastColor = useRef<string[]>([]);
  const lastGlow = useRef<string[]>([]);

  const letters = useMemo(() => splitLetters(t("headline2")), [t]);
  const letterCount = letters.reduce((n, l) => (l.slot >= 0 ? n + 1 : n), 0);
  /** The edge has to run one FADE past the last letter, so that letter is
   *  done at this fraction of the reveal, not at the end of it. The scale
   *  lands on the same frame. */
  const litEnd = (letterCount - 1 + FADE) / (letterCount + FADE);

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
      endH = endBoxRef.current?.offsetHeight ?? 0;
    };
    measure();

    /** One source of truth for every layer, so the reduced-motion end state
     *  is exactly the frame the animation would have finished on. */
    const apply = (progress: number) => {
      // Renormalised so the car pass fills the span between the slide landing
      // and the cover starting.
      const drive = span(progress, SLIDE_END, COVER_START);
      const outro = span(progress, COVER_START, 1);

      // Rises over VehicleSlides, on translate alone.
      if (slideRef.current) {
        const rise = 100 * (1 - clamp01(progress / SLIDE_END));
        slideRef.current.style.transform = `translate3d(0, ${rise.toFixed(3)}%, 0)`;
      }

      // The GTR, and with it the box holding the closing line.
      const gProg = drive;
      const gtrY = wh - gProg * (wh + gtrH);
      if (gtrWrapperRef.current) {
        gtrWrapperRef.current.style.transform = `translate3d(0, ${gtrY.toFixed(2)}px, 0)`;
      }

      // The closing line, lit one letter at a time.
      const reveal = span(gProg, REVEAL_FROM, REVEAL_TO);
      const edge = reveal * (letterCount + FADE);
      for (let i = 0; i < letterCount; i++) {
        const el = letterRefs.current[i];
        if (!el) continue;
        const lt = clamp01((edge - i) / FADE);

        const color = letterColor(lt);
        if (lastColor.current[i] !== color) {
          lastColor.current[i] = color;
          el.style.color = color;
        }

        // The glow rides the edge only — never the finished line.
        const glow = lt > GLOW_FROM && lt < GLOW_TO ? GLOW : "none";
        if (lastGlow.current[i] !== glow) {
          lastGlow.current[i] = glow;
          el.style.textShadow = glow;
        }
      }

      // The block is pulled down out of the mask and grows into place on one
      // eased value, so both finish on the same frame as the last letter.
      // Transform only — the mask's own height, which the bumper tracking
      // reads, never changes.
      const grow = easeOut(clamp01(reveal / litEnd));
      if (endRevealRef.current) {
        endRevealRef.current.style.transform =
          `translate3d(0, ${(SLIDE_FROM * (1 - grow)).toFixed(3)}%, 0)`;
      }
      if (endScaleRef.current) {
        endScaleRef.current.style.transform = `scale(${mix(SCALE_FROM, 1, grow).toFixed(4)})`;
      }

      // The box tracks the rear bumper all the way up, then simply stops at
      // the centre of the stage and lets the car drive on without it. Clamping
      // rather than cross-fading keeps the motion monotonic — no drift back.
      if (endBoxRef.current) {
        const attachedY = gtrY + gtrH * REAR_EDGE; // the rear bumper line
        const parkedY = wh / 2 - endH / 2;
        // Once covered it carries on up with the scroll instead of sitting still.
        const lift = (OUTRO_TEXT_VH * wh) / 100 * outro;
        const offset = Math.max(attachedY, parkedY) - attachedY - lift;
        endBoxRef.current.style.transform = `translate3d(-50%, ${offset.toFixed(2)}px, 0)`;
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
  }, [letterCount, litEnd]);

  return (
    <section
      ref={containerRef}
      /* No background on the section or the stage: the slide wrapper carries
         it, so VehicleSlides stays visible underneath until this card covers
         it. */
      className="relative w-full"
      style={{ height: `${CARD_VH}vh`, marginTop: `${CARD_MARGIN_VH}vh`, zIndex: 20 }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div
          ref={slideRef}
          className="absolute inset-0 h-full w-full overflow-hidden bg-[var(--mm-navy)] will-change-transform"
          style={{ transform: "translate3d(0, 100%, 0)" }}
        >
        {/* The road, held still while the cars and the copy move over it.
            It lives inside the sliding wrapper so it arrives with the card
            rather than showing through before it has risen. The navy on the
            wrapper stays as the backstop under it. */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <Image
            src={ROAD_SRC}
            alt=""
            fill
            sizes="100vw"
            quality={80}
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: `rgba(10,14,20,${ROAD_SCRIM})` }} />
        </div>

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

          {/* GTR, carrying the closing line along under its rear */}
          <div
            ref={gtrWrapperRef}
            className="absolute top-0 w-[90vw] md:w-[42vw] aspect-[1/2] will-change-transform"
          >
            {/* The mask: its top edge IS the rear bumper line, in the car's
                own transform space, so it tracks the car. Everything above
                that line is hidden under the car until it is pulled out. */}
            <div
              ref={endBoxRef}
              className="absolute w-[100vw] overflow-hidden z-0"
              style={{ top: `${REAR_EDGE * 100}%`, left: "50%", transform: "translate3d(-50%, 0, 0)" }}
            >
              {/* Starts a full height up — entirely above the mask, so not a
                  pixel of it shows — and is drawn down to 0. */}
              <div
                ref={endRevealRef}
                className="will-change-transform"
                style={{ transform: `translate3d(0, ${SLIDE_FROM}%, 0)` }}
              >
              <div
                ref={endScaleRef}
                className="flex flex-col items-center justify-center text-center will-change-transform"
                style={{ transform: `scale(${SCALE_FROM})`, transformOrigin: "center top" }}
              >
                <h2
                  aria-label={t("headline2")}
                  className="font-heading leading-tight whitespace-nowrap"
                  style={{ fontSize: "clamp(40px, 6vw, 96px)" }}
                >
                  {letters.map(({ chars, slot }, i) =>
                    slot < 0 ? (
                      <span key={i} aria-hidden="true">{chars}</span>
                    ) : (
                      <span
                        key={i}
                        aria-hidden="true"
                        ref={(el) => { letterRefs.current[slot] = el; }}
                        /* Ships dim so there is no flash before the loop starts. */
                        style={{ color: letterColor(0) }}
                      >
                        {chars}
                      </span>
                    )
                  )}
                </h2>
              </div>
              </div>
            </div>

            {/* The car itself, above the copy — the mask edge only reads as
                "out from under the car" because this sits over it. */}
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

        </div>
      </div>
    </section>
  );
}
