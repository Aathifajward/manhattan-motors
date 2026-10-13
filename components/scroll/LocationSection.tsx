"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import {
  siteConfig,
  telHref,
  mapsEmbedUrlFor,
  mapsDirectionsUrl,
  addressFor,
  openingHoursFor,
} from "@/lib/siteConfig";
import {
  CARD_MARGIN_VH,
  LAST_CARD_VH,
  TEXT_DIM,
  TEXT_RISE_PX,
  clamp01,
  easeOutCubic,
  easeOutQuad,
  slideEnd,
  span,
  useStackProgress,
} from "./stacked";

const BLUE = "#2D7FF9";

/** Full-bleed background photo. */
const LOCATION_IMAGE = "/images/location.jpeg";

/** Shown instead of a broken-image icon while the photo is missing. */
const FALLBACK_BG = "linear-gradient(45deg, #1A2433, #0A0E14)";

/**
 * This is the last card in the stack: it rises over DriveEnd on a hard edge,
 * nothing covers it in turn, and Sell after it is a plain section that scrolls
 * up normally once this pin releases.
 */
const SLIDE_END = slideEnd(LAST_CARD_VH);
/** The copy is scrubbed in just after the card lands, one block after another. */
const REVEAL_FROM = SLIDE_END;
const REVEAL_SPAN = 0.16;
const REVEAL_STAGGER = 0.03;

export default function LocationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  const t = useTranslations("LocationSection");
  const locale = useLocale();

  const apply = useCallback((p: number) => {
    // Rises over the card before it, on translate alone. Eased out, so it
    // settles quickly after DriveEnd's much bigger motion.
    if (slideRef.current) {
      const rise = 100 * (1 - easeOutCubic(clamp01(p / SLIDE_END)));
      slideRef.current.style.transform = `translate3d(0, ${rise.toFixed(3)}%, 0)`;
    }

    // Scrubbed copy: each block lifts 60px and climbs from 25% to full.
    revealRefs.current.forEach((el, i) => {
      if (!el) return;
      const from = REVEAL_FROM + i * REVEAL_STAGGER;
      const r = easeOutQuad(span(p, from, from + REVEAL_SPAN));
      el.style.transform = `translate3d(0, ${(TEXT_RISE_PX * (1 - r)).toFixed(2)}px, 0)`;
      el.style.opacity = (TEXT_DIM + (1 - TEXT_DIM) * r).toFixed(4);
    });
  }, []);

  // Nothing covers this card, so the settled frame is its last one.
  useStackProgress(sectionRef, stageRef, apply, 1);

  const address = addressFor(locale);
  const hours = openingHoursFor(locale);

  return (
    <section
      ref={sectionRef}
      id="location"
      className="relative w-full"
      style={{ height: `${LAST_CARD_VH}vh`, marginTop: `${CARD_MARGIN_VH}vh`, zIndex: 30 }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <div
          ref={slideRef}
          className="absolute inset-0 h-full w-full overflow-hidden will-change-transform"
          style={{ transform: "translate3d(0, 100%, 0)" }}
        >
      {/* Full-bleed background — the photo itself never fades or scales */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: FALLBACK_BG }}
      >
        <Image
          src={LOCATION_IMAGE}
          alt=""
          fill
          sizes="100vw"
          quality={80}
          className="object-cover"
        />
      </div>

      {/* Light left-side scrim, just enough to carry the copy. Caps at 25%
          and fades out well before the map, so most of the photo is untouched. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-full lg:w-[55%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 65%, transparent 100%)",
        }}
      />

      {/* The only other overlay: the bottom 25% ends the section in black.
          Static, never animated. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[25%]"
        style={{ background: "linear-gradient(180deg, transparent 0%, #000 100%)" }}
      />

      {/* Centred in the stage on a wide screen, where it fits with room to
          spare. On a phone the same block is taller than the viewport, and
          centring it put the eyebrow and the heading up behind the fixed
          header — so there it is anchored under the header instead, and the
          spacing below is tightened until the whole thing fits. */}
      <div className="absolute inset-0 z-10 flex items-center max-md:items-start">
        <div className="mx-auto w-full max-w-6xl px-6 py-24 max-md:pb-8 max-md:pt-[var(--mm-nav-safe)]">
        <div className="grid items-center gap-12 max-md:gap-8 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: details ── */}
          <div>
            <span data-reveal ref={(el) => { revealRefs.current[0] = el; }} className="mm-label mb-6 inline-block" style={{ opacity: TEXT_DIM, transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)` }}>
              {t("label")}
            </span>

            <h2
              data-reveal ref={(el) => { revealRefs.current[1] = el; }} className="font-heading mb-10 max-md:mb-6 font-medium leading-tight text-white text-[clamp(2rem,5vw,3.75rem)]"
              style={{ opacity: TEXT_DIM, transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)` }}
            >
              {t("heading")}
            </h2>

            <dl data-reveal ref={(el) => { revealRefs.current[2] = el; }} className="flex flex-col gap-7 max-md:gap-5" style={{ opacity: TEXT_DIM, transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)` }}>
              <div>
                <dt
                  className="mm-meta mb-2 text-xs uppercase tracking-widest"
                  style={{ color: BLUE }}
                >
                  {t("addressLabel")}
                </dt>
                <dd className="whitespace-pre-line text-base leading-relaxed text-white/85">
                  {address}
                </dd>
              </div>

              <div>
                <dt
                  className="mm-meta mb-2 text-xs uppercase tracking-widest"
                  style={{ color: BLUE }}
                >
                  {t("phoneLabel")}
                </dt>
                <dd>
                  <a
                    href={telHref}
                    className="mm-meta text-xl text-white transition-opacity hover:opacity-70"
                  >
                    {siteConfig.phone.display}
                  </a>
                </dd>
              </div>

              <div>
                <dt
                  className="mm-meta mb-2 text-xs uppercase tracking-widest"
                  style={{ color: BLUE }}
                >
                  {t("hoursLabel")}
                </dt>
                <dd className="whitespace-pre-line text-base leading-relaxed text-white/85">
                  {hours}
                </dd>
              </div>
            </dl>

            {/* Ghost button → Google Maps in a new tab */}
            <a
              data-reveal ref={(el) => { revealRefs.current[3] = el; }} href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 max-md:mt-8 inline-flex items-center gap-2 px-8 py-3.5 font-heading font-semibold text-xs uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/5"
              style={{
                                border: "1px solid rgba(45,127,249,0.55)",
                borderRadius: "6px",
                background: "transparent",
              }}
            >
              {t("directions")}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* ── Right: map ── */}
          <div data-reveal ref={(el) => { revealRefs.current[4] = el; }} style={{ opacity: TEXT_DIM, transform: `translate3d(0, ${TEXT_RISE_PX}px, 0)` }}>
            {/* dark-theme map, same treatment the old location block used */}
            <iframe
              title={t("mapTitle")}
              src={mapsEmbedUrlFor(locale)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[320px] w-full border-0 max-md:h-[22dvh] md:h-[420px] lg:h-[500px]"
              style={{ filter: "invert(90%) hue-rotate(180deg)" }}
            />
          </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </section>
  );
}
