"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig, telHref } from "@/lib/siteConfig";
import { revealStart, useRevealOnEnter } from "./useRevealOnEnter";

const BLUE = "#2D7FF9";
const BLUE_GLOW = "rgba(45,127,249,0.35)";

/** Full-bleed background photo. */
const SELL_IMAGE = "/images/sell.jpeg";

/** Shown instead of a broken-image icon while the photo is missing. */
const FALLBACK_BG = "linear-gradient(45deg, #141820, #0A0E14)";

/** Keeps the copy legible over the bare photo — there is no overlay on it. */
const TEXT_SHADOW = "0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.45)";

/**
 * The photo opens pre-zoomed and pulls back to 1 once the section comes into
 * view. Origin sits below centre so the cars stay in frame as it pulls back; it
 * never goes under 1, so no empty edge can appear.
 */
const ZOOM_FROM = 1.2;
const ZOOM_ORIGIN = "center 60%";
const ZOOM_DURATION = 1600;
const ZOOM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * A plain page section: one viewport tall, scrolling normally into and out of
 * view. The copy rises in when it enters, the photo pulls back from its
 * pre-zoom, and nothing is pinned or scrubbed.
 */
export default function SellSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const t = useTranslations("SellSection");

  useRevealOnEnter(sectionRef);

  // The photo's own one-shot pull-back. It is kept out of `[data-reveal]`
  // because that hook ends on translateY(0), which would drop the scale.
  useEffect(() => {
    const section = sectionRef.current;
    const img = imageRef.current;
    if (!section || !img) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const settle = () => {
      img.style.transform = "scale(1)";
    };

    if (reduced) {
      settle();
      return;
    }

    img.style.transition = `transform ${ZOOM_DURATION}ms ${ZOOM_EASE}`;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        settle();
        io.disconnect();
      },
      { threshold: 0.15 }
    );
    io.observe(section);

    return () => io.disconnect();
  }, []);

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
      className="relative h-[100svh] w-full overflow-hidden"
    >
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
        data-reveal
        className="absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center"
        style={{ top: "min(18vh, calc(28vh - 150px))", ...revealStart }}
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
        data-reveal
        className="absolute inset-x-0 bottom-[9vh] z-10 flex flex-col items-center justify-center gap-3 px-6 sm:flex-row"
        style={revealStart}
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
    </section>
  );
}
