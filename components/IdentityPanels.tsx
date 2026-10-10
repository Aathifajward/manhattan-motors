"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Panel = {
  key: "CAR" | "SUV" | "VAN" | "TRUCK";
  /** Giant faint word behind the copy. */
  word: string;
  image: string;
  /** Pre-blurred copy used for the text panel (scripts/generate-blur.mjs). */
  blurSrc: string;
  /**
   * object-position for the sharp photo. Pushed to the right so the whole
   * front of the vehicle sits inside the 60vw box; tune per photo.
   */
  position: string;
};

/**
 * Four panels on one sticky stage, all sharing a two-column layout: a blurred,
 * mirrored text panel on the left 40vw and the sharp photo in the right 60vw.
 * The split is a hard vertical edge — the two sides deliberately do not share a
 * crop, so the vehicle never looks like it continues across it.
 *
 * Adding an entry is enough — the timeline, the "0X / 0N" counter, the vertical
 * index and the section height all follow the array. MACHINERY and MOTORCYCLE
 * are parked; their translation keys still exist.
 */
const PANELS: Panel[] = [
  { key: "CAR", word: "CARS", image: "/images/car.jpeg", blurSrc: "/images/blur/car-blur.jpg", position: "100% center" },
  { key: "SUV", word: "SUVS", image: "/images/suv.jpeg", blurSrc: "/images/blur/suv-blur.jpg", position: "100% center" },
  { key: "VAN", word: "VANS", image: "/images/van.jpeg", blurSrc: "/images/blur/van-blur.jpg", position: "100% center" },
  { key: "TRUCK", word: "TRUCKS", image: "/images/truck.jpeg", blurSrc: "/images/blur/truck-blur.jpg", position: "100% center" },
];

/** Shown instead of a broken-image icon while a photo is missing. */
const FALLBACK_BG = "linear-gradient(135deg, #1A2433 0%, #0A0E14 100%)";

const COUNT = PANELS.length;
/** 0.00-0.15 is the stage slide-up; the rest splits evenly between the panels. */
const INTRO_END = 0.15;
const SLICE = (1 - INTRO_END) / COUNT;
/** Fraction of a panel's slice spent opening its clip. */
const REVEAL = 0.4;
/** Share of a transition given to the outgoing copy leaving and the incoming
 *  copy arriving. They do not overlap, so only one text block is ever on
 *  screen: the old one is gone by 0.4, the new one starts at 0.6. */
const TEXT_OUT = 0.4;
const TEXT_IN = 0.6;

/** Vertical-only drift for the photo. The mover's overshoot is kept small
 *  (104%) because `object-fit: cover` scales to the mover's height — any extra
 *  height enlarges the picture and eats into how much of the vehicle fits. */
const MAIN_Y = 2;
const WORD_X = 6; // vw — the word drifts against the photo
const WORD_OPACITY = 0.07;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const step = (v: number) => (v >= 0.5 ? 1 : 0);

/** The one reveal, shared by every panel: a centred rectangle opening outwards. */
const clipFor = (t: number) => `inset(${(50 * (1 - t)).toFixed(2)}%)`;

/** Left column on desktop, full width on mobile. */
const LEFT_COLUMN = "absolute inset-y-0 left-0 w-full overflow-hidden md:w-[40vw]";

export default function IdentityPanels() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const clipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moveRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indexRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const indexLineRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("IdentityPanels");

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const slide = slideRef.current;
    if (!section || !stage || !slide) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let disposed = false;
    let rafId = 0;
    const enter = new Array<number>(COUNT).fill(0);

    // Geometry is cached here and on resize so the rAF loop never reads layout.
    let topPx = 0;
    let scrollable = 1;
    const measure = () => {
      topPx = section.offsetTop;
      scrollable = Math.max(1, section.offsetHeight - stage.offsetHeight);
    };
    measure();

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const progress = clamp01((window.scrollY - topPx) / scrollable);

      // The stage rises into place on translate alone — it never fades, at
      // either end; the section simply unpins.
      const intro = reduced || progress >= INTRO_END ? 0 : 1 - progress / INTRO_END;
      slide.style.transform = `translateY(${(intro * 100).toFixed(2)}%)`;

      // How far each panel has wiped in. Panel 0 is the base layer, already
      // open while the stage slides up.
      let active = 0;
      for (let i = 0; i < COUNT; i++) {
        const local = (progress - (INTRO_END + i * SLICE)) / SLICE;
        const e = i === 0 ? 1 : clamp01(local / REVEAL);
        enter[i] = reduced ? step(e) : e;
        if (enter[i] >= 0.5) active = i;
      }

      for (let i = 0; i < COUNT; i++) {
        const local = (progress - (INTRO_END + i * SLICE)) / SLICE;
        const held = clamp01(local);

        const open = enter[i];
        // Copy only: the outgoing block clears out in the first 40% of the
        // transition, the incoming one arrives in the last 40%. Images have no
        // exit animation of any kind.
        const next = i === COUNT - 1 ? 0 : enter[i + 1];
        let textOut = clamp01(next / TEXT_OUT);
        let textIn = clamp01((open - TEXT_IN) / (1 - TEXT_IN));
        if (reduced) {
          textOut = step(textOut);
          textIn = step(textIn);
        }
        const textShown = textIn * (1 - textOut);

        // The blurred text panel crossfades; the layers are stacked, so a plain
        // fade-in is enough and the outgoing one never animates.
        const bg = bgRefs.current[i];
        if (bg) bg.style.opacity = String(open);

        // Parallax drift — translateY only, so the horizontal crop stays put
        // and the whole vehicle keeps its margins. The photo never scales.
        const drift = reduced ? 0 : (held - 0.5) * 2;
        const move = moveRefs.current[i];
        if (move) {
          move.style.transform = `translateY(${(drift * MAIN_Y).toFixed(3)}%)`;
        }

        // Only the incoming image animates: its rectangle opens on top of the
        // one before, which is simply covered. Nothing ever closes.
        const clip = clipRefs.current[i];
        if (clip) clip.style.clipPath = clipFor(open);

        // The giant word follows the copy, so it never lingers over the next one.
        const word = wordRefs.current[i];
        if (word) {
          word.style.transform = `translateX(${(-drift * WORD_X).toFixed(3)}vw)`;
          word.style.opacity = (WORD_OPACITY * textShown).toFixed(4);
        }

        // Copy is the one thing allowed to slide and fade.
        const text = textRefs.current[i];
        if (text) {
          text.style.transform =
            `translateY(${(40 * (1 - textIn) - 40 * textOut).toFixed(2)}%)`;
          text.style.opacity = textShown.toFixed(4);
        }
        const textWrap = textWrapRefs.current[i];
        if (textWrap) {
          textWrap.style.pointerEvents = textShown > 0.99 ? "auto" : "none";
        }
      }

      for (let i = 0; i < COUNT; i++) {
        const label = indexRefs.current[i];
        if (label) label.style.opacity = i === active ? "1" : "0.35";
      }
      if (indexLineRef.current) {
        indexLineRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;
      }

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

  const total = String(COUNT).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      className="relative w-full -mt-[100vh]"
      /* One viewport per panel, plus a buffer for the slide-up intro. */
      style={{ zIndex: 10, height: `${(COUNT + 1) * 100}vh` }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden pointer-events-none"
      >
        <div
          ref={slideRef}
          className="absolute inset-0 h-full w-full overflow-hidden will-change-transform"
          style={{ transform: "translateY(100%)", background: FALLBACK_BG }}
        >
          {/* ── 1. Text panel: the blurred photo, mirrored and darkened, so it
                 reads as its own surface rather than a continuation of the
                 picture. The blur is baked into the file; no CSS filter. ── */}
          <div className={`${LEFT_COLUMN} z-0`} style={{ background: FALLBACK_BG }}>
            {PANELS.map((panel, i) => (
              <div
                key={panel.key}
                ref={(el) => { bgRefs.current[i] = el; }}
                className="absolute inset-0 h-full w-full"
                style={{ zIndex: i, opacity: i === 0 ? 1 : 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={panel.blurSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover object-center"
                  /* Mirrored so it never lines up with the sharp photo. */
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            ))}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.35)", zIndex: COUNT }}
            />
          </div>

          {/* ── 2. Giant words, clipped to the text panel so they never run
                 over the vehicle ── */}
          <div className={`${LEFT_COLUMN} pointer-events-none z-[5]`}>
            {PANELS.map((panel, i) => (
              <div
                key={panel.key}
                ref={(el) => { wordRefs.current[i] = el; }}
                aria-hidden="true"
                className="font-heading absolute left-[4vw] top-[58vh] select-none whitespace-nowrap text-[18vw] font-medium uppercase leading-none text-white will-change-transform md:left-[2vw] md:top-[32vh] md:text-[22vw]"
                style={{ opacity: i === 0 ? WORD_OPACITY : 0 }}
              >
                {panel.word}
              </div>
            ))}
          </div>

          {/* ── 3. Sharp photo: exactly the right 60vw, hard edge, own box ── */}
          {PANELS.map((panel, i) => (
            <div
              key={panel.key}
              ref={(el) => { clipRefs.current[i] = el; }}
              className="absolute left-0 top-0 h-[45vh] w-full overflow-hidden md:left-[40vw] md:h-full md:w-[60vw]"
              style={{ clipPath: clipFor(i === 0 ? 1 : 0), zIndex: 10 + i }}
            >
              <div
                ref={(el) => { moveRefs.current[i] = el; }}
                className="absolute left-0 top-[-2%] h-[104%] w-full will-change-transform"
              >
                <Image
                  src={panel.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  quality={80}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="object-cover"
                  style={{ objectPosition: panel.position }}
                />
              </div>
            </div>
          ))}

          {/* ── 4. Copy — slides through its own clipped box, translateY only ── */}
          {PANELS.map((panel, i) => (
            <div
              key={panel.key}
              ref={(el) => { textWrapRefs.current[i] = el; }}
              className="absolute left-[6vw] top-[50vh] z-30 h-[40vh] w-[88vw] overflow-hidden text-left md:left-[5vw] md:top-[24vh] md:h-[40vh] md:w-[30vw]"
            >
              <div
                ref={(el) => { textRefs.current[i] = el; }}
                className="flex h-full flex-col justify-center will-change-[transform,opacity]"
                style={{
                  transform: i === 0 ? "translateY(0)" : "translateY(40%)",
                  opacity: i === 0 ? 1 : 0,
                }}
              >
                <span className="mm-meta mb-4 text-sm tracking-widest text-[#2D7FF9]">
                  {String(i + 1).padStart(2, "0")} / {total}
                </span>
                <h2 className="font-heading mb-5 text-4xl leading-tight text-white md:text-5xl">
                  {t(`categories.${panel.key}.title`)}
                </h2>
                <p className="mm-body-copy mb-7 max-w-lg">
                  {t(`categories.${panel.key}.text`)}
                </p>
                <div>
                  <Link
                    href={{ pathname: "/vehicles", query: { category: panel.key } }}
                    className="font-heading inline-block bg-[#2D7FF9] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-white hover:text-black"
                  >
                    {t(`categories.${panel.key}.button`)}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* ── 5. Vertical index, bottom-left of the text panel (desktop) ── */}
          <div className="pointer-events-none absolute bottom-[8vh] left-[5vw] z-40 hidden md:flex md:items-center md:gap-4">
            <div className="relative h-[14vh] w-px bg-white/15">
              <div
                ref={indexLineRef}
                className="absolute inset-0 origin-top bg-white will-change-transform"
                style={{ transform: "scaleY(0)" }}
              />
            </div>
            <div className="flex flex-col gap-3">
              {PANELS.map((panel, i) => (
                <span
                  key={panel.key}
                  ref={(el) => { indexRefs.current[i] = el; }}
                  className="mm-meta text-[11px] uppercase tracking-[0.2em] text-white"
                  style={{ opacity: i === 0 ? 1 : 0.35 }}
                >
                  {t(`short.${panel.key}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
