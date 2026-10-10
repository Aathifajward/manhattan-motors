"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig, telHref } from "@/lib/siteConfig";
import ProgressLine from "./ProgressLine";
import {
  CARD_VH,
  CARD_MARGIN_VH,
  OUTRO_DIM,
  OUTRO_RISE_VH,
  TEXT_DIM,
  TEXT_RISE_PX,
  coverStart,
  slideEnd,
  useStackProgress,
} from "./stacked";

const BLUE = "#2D7FF9";
const BLUE_GLOW = "rgba(45,127,249,0.35)";

/** Full-bleed background photo. */
const SELL_IMAGE = "/images/sell.jpeg";

/** Shown instead of a broken-image icon while the photo is missing. */
const FALLBACK_BG = "linear-gradient(45deg, #141820, #0A0E14)";

/** Keeps the copy legible over the bare photo — there is no overlay on it. */
const TEXT_SHADOW = "0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.45)";

/**
 * The photo opens pre-zoomed and eases back to 1 over the first three quarters
 * of the section. Origin sits below centre so the cars stay in frame as it
 * pulls back; it never goes under 1, so no empty edge can appear.
 */
const ZOOM_FROM = 1.2;
const ZOOM_END = 0.75;
const ZOOM_ORIGIN = "center 60%";

const SLIDE_END = slideEnd();
const COVER_START = coverStart();
/** The cars settle as the card lands, then the copy is scrubbed in. */
const TEXT_FROM = SLIDE_END;
const TEXT_TO = SLIDE_END + 0.16;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function SellSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const topBlockRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("SellSection");

  const apply = useCallback((p: number) => {
    // Rises over the Location card, on translate alone.
    if (slideRef.current) {
      const rise = 100 * (1 - clamp01(p / SLIDE_END));
      slideRef.current.style.transform = `translate3d(0, ${rise.toFixed(3)}%, 0)`;
    }

    // The photo pulls back from its pre-zoom as the card lands.
    if (imageRef.current) {
      const zoom = ZOOM_FROM - (ZOOM_FROM - 1) * easeOut(span(p, 0, ZOOM_END));
      imageRef.current.style.transform = `scale(${zoom.toFixed(4)})`;
    }

    // Scrubbed copy: 60px lift, 25% -> full.
    const reveal = span(p, TEXT_FROM, TEXT_TO);
    const rise = `translate3d(0, ${(TEXT_RISE_PX * (1 - reveal)).toFixed(2)}px, 0)`;
    const op = (TEXT_DIM + (1 - TEXT_DIM) * reveal).toFixed(4);
    for (const el of [topBlockRef.current, ctaRef.current]) {
      if (!el) continue;
      el.style.transform = rise;
      el.style.opacity = op;
    }

    // Being covered by the footer card: drift up and darken.
    const out = span(p, COVER_START, 1);
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(0, ${(-OUTRO_RISE_VH * out).toFixed(3)}vh, 0)`;
    }
    if (dimRef.current) dimRef.current.style.opacity = (OUTRO_DIM * out).toFixed(4);
    if (lineRef.current) lineRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
  }, []);

  useStackProgress(sectionRef, stageRef, apply, COVER_START);

  const backToTop = () => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="sell"
      className="relative w-full"
      style={{ height: `${CARD_VH}vh`, marginTop: `${CARD_MARGIN_VH}vh`, zIndex: 40 }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div
          ref={slideRef}
          className="absolute inset-0 h-full w-full overflow-hidden will-change-transform"
          style={{ transform: "translate3d(0, 100%, 0)" }}
        >
        <div ref={innerRef} className="absolute inset-0 will-change-transform">

        {/* The photo, in its own overflow-hidden box at full size */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 0, background: FALLBACK_BG }}
        >
          <Image
            ref={imageRef}
            src={SELL_IMAGE}
            alt=""
            fill
            sizes="100vw"
            quality={80}
            className="object-cover"
            style={{
              transform: `scale(${ZOOM_FROM})`,
              transformOrigin: ZOOM_ORIGIN,
              willChange: "transform",
            }}
          />
        </div>

        {/* The only gradient: a short black fade at the very top */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[14vh]"
          style={{ background: "linear-gradient(to bottom, #000 0%, transparent 100%)", zIndex: 1 }}
        />

        {/* Upper dark band: headline + sub-line, clear of the cars.
            The cars start at a fixed 28% of the stage while this block stays a
            fixed ~113px tall, so a flat 18vh only clears on tall viewports —
            hence the min(): 18vh when there is room, backed off when there is
            not, which holds on 1920x1080, 1440x800 and mobile alike. */}
        <div
          ref={topBlockRef}
          className="absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center"
          style={{
            top: "min(18vh, calc(28vh - 150px))",
            transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)`,
            opacity: TEXT_DIM,
            willChange: "transform, opacity",
          }}
        >
          <h2
            className="font-heading font-medium text-white text-[clamp(2rem,4.2vw,4rem)]"
            style={{ lineHeight: 1.05, maxWidth: "14ch", textShadow: TEXT_SHADOW }}
          >
            {t("heading")}
          </h2>
          <p
            className="font-body mt-5 text-white/70 text-[clamp(0.95rem,1.1vw,1.15rem)]"
            style={{ maxWidth: "520px", textShadow: TEXT_SHADOW }}
          >
            {t("subline")}
          </p>
        </div>

        {/* Lower dark band: the two calls to action, side by side */}
        <div
          ref={ctaRef}
          className="absolute inset-x-0 bottom-[9vh] z-10 flex flex-col items-center justify-center gap-3 px-6 sm:flex-row"
          style={{ transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)`, opacity: TEXT_DIM, willChange: "transform, opacity" }}
        >
          <Link
            href={{ pathname: "/contact", query: { type: "sell" } }}
            className="font-heading inline-flex items-center gap-2 px-[26px] py-[14px] text-[0.75rem] font-semibold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            style={{
              background: BLUE,
              borderRadius: "6px",
              boxShadow: `0 0 32px ${BLUE_GLOW}, 0 4px 16px rgba(0,0,0,0.4)`,
            }}
          >
            {t("sellCta")}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <a
            href={telHref}
            className="inline-flex items-center gap-2 px-[26px] py-[14px] text-[0.75rem] uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/5"
            style={{
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "6px",
              background: "transparent",
              textShadow: TEXT_SHADOW,
            }}
          >
            {t("callCta")}
            <span className="normal-case tracking-normal text-white/55">
              {siteConfig.phone.display}
            </span>
          </a>
        </div>

        {/* Back to top — the small arrow at the very bottom */}
        <div className="absolute inset-x-0 bottom-[2.5vh] z-10 flex justify-center">
          <button
            type="button"
            onClick={backToTop}
            className="group inline-flex flex-col items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors duration-200 hover:text-white"
            style={{ textShadow: TEXT_SHADOW }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("backToTop")}
          </button>
        </div>

        </div>

          {/* Darkens while the footer card covers this one */}
          <div
            ref={dimRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 bg-black"
            style={{ opacity: 0 }}
          />

          <ProgressLine lineRef={lineRef} />
        </div>
      </div>
    </section>
  );
}
