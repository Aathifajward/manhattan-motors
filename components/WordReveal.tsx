"use client";

import { useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

/** The photo behind the tall viewport mask. */
const WORD_REVEAL_IMAGE = "/images/wordreveal.jpeg";

/** The frame is 26vw on desktop, floored at 220px on small screens. */
const IMAGE_SIZES = "(max-width: 768px) 220px, 26vw";

/** Shown instead of a broken-image icon while the photo is missing. */
const FALLBACK_BG = "linear-gradient(135deg, #1A2433 0%, #0A0E14 100%)";

/* ── Reading-edge colours ──────────────────────────────────────────────── */
/** Not yet read. */
const GREY: [number, number, number] = [110, 118, 130];
/** The site blue, at the leading edge. */
const BLUE: [number, number, number] = [47, 139, 255];
/** Settled, behind the edge. */
const WHITE: [number, number, number] = [255, 255, 255];

/** How many words behind the edge it takes to cool from blue to white. */
const BLUE_TAIL = 3;
/** Words within this distance of the edge carry the glow — about three. */
const GLOW_FROM = -0.5;
const GLOW_TO = 2.5;
const GLOW = "0 0 18px rgba(47,139,255,0.55)";

/** Word-by-word timing — unchanged. */
const WORD_START = 0.05;
const WORD_END = 0.85;

/* ── Image mask ────────────────────────────────────────────────────────── */
/** The picture is taller than its frame, so the frame always hides top and bottom. */
const IMAGE_HEIGHT = 136; // % of the frame
/** It slides up by this share of its own height across the section. */
const IMAGE_TRAVEL = 26; // %
/** The frame drifts a little slower than the copy. */
const FRAME_TRAVEL = 6; // vh
/** Smoothing applied to the scroll-linked position. */
const LERP = 0.12;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function colorAt(distance: number) {
  // distance < 0 is still ahead of the edge, 0 is at it, > 0 is behind it.
  const toBlue = clamp01(distance + 1); // grey -> blue over the word before the edge
  const toWhite = clamp01((distance - 1) / (BLUE_TAIL - 1)); // blue -> white behind it
  const r = mix(mix(GREY[0], BLUE[0], toBlue), WHITE[0], toWhite);
  const g = mix(mix(GREY[1], BLUE[1], toBlue), WHITE[1], toWhite);
  const b = mix(mix(GREY[2], BLUE[2], toBlue), WHITE[2], toWhite);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

export default function WordReveal() {
  const t = useTranslations("WordReveal");
  const locale = useLocale();
  const text = t("sentence");
  const caption = t("caption");

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Last value written per word, so the loop only touches the DOM on change.
  const lastColor = useRef<string[]>([]);
  const lastGlow = useRef<string[]>([]);

  // Split into segments (words or Japanese character chunks)
  const segments = useMemo(() => {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
      return Array.from(segmenter.segment(text)).map(s => s.segment);
    } catch {
      // Fallback if Intl.Segmenter is not available
      return locale === "ja" ? text.split("") : text.split(" ");
    }
  }, [text, locale]);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const frame = frameRef.current;
    const img = imageRef.current;
    if (!container || !sticky) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Settled state, no loop: every word readable, nothing moving.
      wordsRef.current.forEach((el) => {
        if (!el) return;
        el.style.color = "rgb(255, 255, 255)";
        el.style.textShadow = "none";
      });
      if (frame) frame.style.transform = "translate3d(0, 0, 0)";
      if (img) img.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    let disposed = false;
    let rafId = 0;
    let eased = 0;
    let primed = false;

    const total = segments.length;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;

      // 1. Reading edge, as a floating word index. Same schedule as before.
      const edge = ((progress - WORD_START) / (WORD_END - WORD_START)) * total;

      for (let i = 0; i < total; i++) {
        const el = wordsRef.current[i];
        if (!el) continue;

        const distance = edge - i;

        const color = colorAt(distance);
        if (lastColor.current[i] !== color) {
          lastColor.current[i] = color;
          el.style.color = color;
        }

        // The glow rides the edge only — never the whole sentence.
        const glow = distance > GLOW_FROM && distance < GLOW_TO ? GLOW : "none";
        if (lastGlow.current[i] !== glow) {
          lastGlow.current[i] = glow;
          el.style.textShadow = glow;
        }
      }

      // 2. The picture slides up behind its window. Eased for a slow, heavy feel.
      const target = Math.min(1, progress / 0.9);
      eased = primed ? eased + (target - eased) * LERP : target;
      primed = true;
      if (Math.abs(target - eased) < 0.0005) eased = target;

      if (img) {
        img.style.transform = `translate3d(0, ${(-IMAGE_TRAVEL * eased).toFixed(3)}%, 0)`;
      }
      if (frame) {
        frame.style.transform = `translate3d(0, ${(-FRAME_TRAVEL * eased).toFixed(3)}vh, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    tick();

    const onScrollOrResize = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [segments.length]);

  return (
    <section ref={containerRef} className="relative w-full h-[300vh] sm:h-[250vh]" style={{ backgroundColor: "var(--mm-navy)" }}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col md:flex-row items-center justify-center md:justify-between px-6 py-12 md:py-20 max-w-7xl mx-auto gap-8 md:gap-12">

        {/* Left: the sentence, lit word by word */}
        <div className="w-full md:w-[60%] flex flex-col justify-center">
          <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.3]">
            {segments.map((segment, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordsRef.current[i] = el;
                }}
                /* Ships dim so there is no flash before the loop starts. */
                style={{ color: `rgb(${GREY[0]}, ${GREY[1]}, ${GREY[2]})` }}
              >
                {segment}
              </span>
            ))}
          </h2>
        </div>

        {/* Right: a tall window the picture slides up behind */}
        <div className="flex w-full flex-col items-center md:w-auto md:items-end">
          <div
            ref={frameRef}
            className="relative h-[42vh] overflow-hidden will-change-transform md:h-[68vh]"
            style={{ width: "max(220px, 26vw)", background: FALLBACK_BG }}
          >
            {/* Taller than the frame, so its top and bottom stay hidden at all
                times. Transform only — the picture never scales. */}
            <div
              ref={imageRef}
              className="absolute inset-x-0 top-0 will-change-transform"
              style={{ height: `${IMAGE_HEIGHT}%` }}
            >
              <Image
                src={WORD_REVEAL_IMAGE}
                alt={caption}
                fill
                sizes={IMAGE_SIZES}
                quality={80}
                className="object-cover"
              />
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-center md:text-right" style={{ color: "rgba(255,255,255,0.4)" }}>
            {caption}
          </p>
        </div>

      </div>
    </section>
  );
}
