"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig, telHref } from "@/lib/siteConfig";
import { clamp01 } from "./stacked";
import { revealStart, useRevealOnEnter } from "./useRevealOnEnter";

const BLUE = "#2D7FF9";
const BLUE_GLOW = "rgba(45,127,249,0.35)";

/** The whole stage is this; only the bottom band carries a picture. */
const BLACK = "#000";

/** The bottom band: three cars on their own black field. */
const SELL_IMAGE = "/images/sellbg.png";

/* ── Sizing from the art's content, not its frame ─────────────────────────
   The file is 2400x1340, but the cars only live in the middle of it: rows
   374-915 and columns 133-2291, measured off the pixels. So 10% of its width
   and a full 60% of its height is black margin, and drawing the whole frame
   at 100vw is what made the cars read small — they were 40% of a picture
   that was itself letterboxed into the stage.

   So the frame is drawn deliberately oversized and its margins are spent
   rather than shown: the sides are pushed just off the viewport so the outer
   vans reach the edges, the bottom margin hangs below the stage, and the top
   margin runs up behind the copy, where it is black on black. What is left
   on screen is the cars, as large as they can be without cutting them.    */

const ART_RATIO = 1340 / 2400;
/** Fractions of the file, from the pixels. */
const ART_CARS_TOP = 0.279;
const ART_CARS_BOTTOM = 0.317; // margin below them
const ART_CARS_HEIGHT = 1 - ART_CARS_TOP - ART_CARS_BOTTOM; // 0.404

/** Drawn this wide. The art's own 10% of side margin means the vans stop a
 *  little short of the viewport edges here — invisible, since that margin is
 *  black on black. 115 would put them exactly on the edges, and past that it
 *  starts cutting bodywork rather than black. */
const IMG_W_VW = 104;
const IMG_H_VW = IMG_W_VW * ART_RATIO; // 58.1

const vw = (n: number) => `${n.toFixed(2)}vw`;

/** Black left under the cars, which is where the back-to-top arrow sits. */
const CARS_BOTTOM_VH = 8;
/** Hangs the art's bottom margin below the stage instead of letting it lift
 *  the cars into the copy. */
const IMG_BOTTOM = `calc(${CARS_BOTTOM_VH}vh - ${vw(ART_CARS_BOTTOM * IMG_H_VW)})`;
/** The roofline, measured up from the stage's bottom edge. Everything above
 *  it is clear black, and it is exactly the room the copy gets. */
const CARS_TOP = `calc(${CARS_BOTTOM_VH}vh + ${vw(ART_CARS_HEIGHT * IMG_H_VW)})`;

/** Keeps the copy legible where it crosses the band. */
const TEXT_SHADOW = "0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.45)";

/**
 * The block opens well outside its frame and eases back to 1, anchored to the
 * bottom edge it sits on. It never goes under 1, so the picture can never
 * pull short of the box it is clipped by — over 1 it simply overflows, which
 * the box hides.
 */
const ZOOM_FROM = 1.5;
const ZOOM_ORIGIN = "center bottom";
/**
 * The pull-back runs from the section's top entering at the viewport bottom
 * to this far past the point where it fills the viewport, so it is still
 * travelling while the whole picture is on screen rather than finishing on
 * the way in. Clamped to whatever scroll the page actually has left.
 */
const ZOOM_TAIL_VH = 60;
/**
 * A softer landing than the shared cubic, which spends 87% of its travel in
 * the first half of the range — that is what made the move read as a flick
 * rather than a pull-back.
 */
const ease = (t: number) => 1 - (1 - t) * (1 - t);

/**
 * A plain page section: one viewport tall, scrolling normally into and out of
 * view. Nothing is pinned. The copy rises in once when it enters; the bottom
 * band's pull-back is scrubbed on the section's own entry.
 */
export default function SellSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("SellSection");

  useRevealOnEnter(sectionRef);

  // The band's pull-back, scrubbed on scroll rather than played once. It is
  // kept out of `[data-reveal]` because that hook ends on translateY(0),
  // which would drop the scale.
  useEffect(() => {
    const section = sectionRef.current;
    const img = imageRef.current;
    if (!section || !img) return;

    const settle = () => {
      img.style.transform = "translateX(-50%) scale(1)";
    };

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      settle();
      return;
    }

    // Cached so the frame loop does no layout reads: the scroll position the
    // pull-back starts from, and how far it runs.
    let from = 0;
    let span = 1;
    const measure = () => {
      const vh = window.innerHeight || 1;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      from = top - vh; // the section's top at the viewport bottom
      const to = Math.min(top + (ZOOM_TAIL_VH / 100) * vh, maxScroll);
      span = Math.max(1, to - from);
    };
    measure();

    let disposed = false;
    let rafId = 0;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const zoom = ZOOM_FROM - (ZOOM_FROM - 1) * ease(clamp01((window.scrollY - from) / span));
      img.style.transform = `translateX(-50%) scale(${zoom.toFixed(4)})`;

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

    // The range is measured against the document's own height, so anything
    // that reflows the page below this section moves it. Same reason the
    // stacked cards watch the document element.
    const ro =
      typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
    ro?.observe(document.documentElement);

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
    };
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
      style={{ background: BLACK }}
    >
      {/* The cars, low on the stage. Oversized and hung off the bottom so the
          art's own margins fall outside the frame; the section clips them. */}
      <div
        ref={imageRef}
        aria-hidden="true"
        className="absolute left-1/2 will-change-transform"
        style={{
          width: `${IMG_W_VW}vw`,
          bottom: IMG_BOTTOM,
          zIndex: 0,
          transform: `translateX(-50%) scale(${ZOOM_FROM})`,
          transformOrigin: ZOOM_ORIGIN,
        }}
      >
        <Image
          src={SELL_IMAGE}
          alt=""
          width={2400}
          height={1340}
          sizes={`${IMG_W_VW}vw`}
          quality={85}
          className="block h-auto w-full"
        />
      </div>

      {/* The only gradient: a short black fade at the very top */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[14vh]"
        style={{ background: "linear-gradient(to bottom, #000 0%, transparent 100%)", zIndex: 1 }}
      />

      {/* Everything above the cars: headline, sub-line, then the two calls to
          action directly under them. The box is exactly the clear black — it
          ends on the roofline — and the stack is centred in it, so however
          the picture is sized the copy sits in the room left over and can
          never run into it. */}
      <div
        className="absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-center px-6 py-[1vh] text-center"
        style={{ height: `calc(100% - ${CARS_TOP})` }}
      >
        <div data-reveal className="flex flex-col items-center" style={revealStart}>
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

        {/* The two calls to action, directly under the sub-line */}
        <div
          data-reveal
          className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
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
