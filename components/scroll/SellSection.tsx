"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig, telHref } from "@/lib/siteConfig";
import { clamp01, easeInOut } from "./stacked";
import { revealStart, useRevealOnEnter } from "./useRevealOnEnter";
import { useIsMobile } from "./useIsMobile";
import { onViewportChange } from "./viewport";

const BLUE = "#2D7FF9";
const BLUE_GLOW = "rgba(45,127,249,0.35)";

/** The whole stage is this; only the bottom band carries a picture. */
const BLACK = "#000";

/* ── Sizing from the art's content, not its frame ─────────────────────────
   The desktop file is 2400x1340, but the cars only live in the middle of it:
   rows 374-915 and columns 133-2291, measured off the pixels. So 10% of its
   width and a full 60% of its height is black margin, and drawing the whole
   frame at 100vw is what made the cars read small — they were 40% of a picture
   that was itself letterboxed into the stage.

   So the frame is drawn deliberately oversized and its margins are spent
   rather than shown: the sides are pushed just off the viewport so the outer
   vans reach the edges, the bottom margin hangs below the stage, and the top
   margin runs up behind the copy, where it is black on black. What is left
   on screen is the cars, as large as they can be without cutting them.

   None of which saves it on a phone. Three vehicles across 390px leaves each
   one about 100px wide, and what reads at that size is not three cars but one
   row of overlapping shapes. So the phone is given the middle car on its own —
   cropped out of the same photograph by scripts/crop-sell-mobile.mjs, not
   zoomed out of the full frame — and drawn edge to edge. The art's margins are
   transparent in both files, so a crop edge can never show against the stage.

   Everything below is stated as fractions of whichever file is drawn, so the
   same three measurements place either one.                                */

type Art = {
  src: string;
  /** Intrinsic pixels, for next/image. */
  width: number;
  height: number;
  /** Drawn this wide, in vw. */
  widthVw: number;
  /** Margin below the cars, as a fraction of the file's height. */
  belowCars: number;
  /** And how much of that height the cars themselves take. */
  carsHeight: number;
};

/** Drawn at 104vw: the art's own 10% of side margin means the vans stop a
 *  little short of the viewport edges, which is invisible. 115 would put them
 *  exactly on the edges, and past that it cuts bodywork rather than margin. */
const DESKTOP_ART: Art = {
  src: "/images/sellbg.png",
  width: 2400,
  height: 1340,
  widthVw: 104,
  belowCars: 0.317,
  carsHeight: 0.404, // 1 - 0.279 above - 0.317 below
};

/** The crop is 650x450 with the car at columns 24-626 and rows 40-410, so at a
 *  full 100vw the car itself spans 93vw — the width filled, with the black the
 *  crop was given either side falling just inside the viewport edges. */
const MOBILE_ART: Art = {
  src: "/images/sellbg-mobile.png",
  width: 650,
  height: 450,
  widthVw: 100,
  belowCars: 0.089,
  carsHeight: 0.822,
};

const vw = (n: number) => `${n.toFixed(2)}vw`;

/** Black left under the cars, which is where the back-to-top arrow sits.
 *  In dvh, the unit the stage itself is in. */
const CARS_BOTTOM_DVH = 8;

/** The three measurements the layout needs from whichever file is drawn. */
function geometryOf(art: Art) {
  const imgHVw = art.widthVw * (art.height / art.width);
  return {
    /** Hangs the art's bottom margin below the stage instead of letting it
     *  lift the cars into the copy. */
    imgBottom: `calc(${CARS_BOTTOM_DVH}dvh - ${vw(art.belowCars * imgHVw)})`,
    /** The roofline, measured up from the stage's bottom edge. Everything
     *  above it is clear black, and it is exactly the room the copy gets. */
    carsTop: `calc(${CARS_BOTTOM_DVH}dvh + ${vw(art.carsHeight * imgHVw)})`,
  };
}

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
 * Ease in and out, not out alone: this section is the page's landing, and
 * should feel deliberate at both ends — the opposite of the slide changes
 * just before it.
 */
const ease = easeInOut;

/**
 * A plain page section: one viewport tall, scrolling normally into and out of
 * view. Nothing is pinned. The copy rises in once when it enters; the bottom
 * band's pull-back is scrubbed on the section's own entry.
 */
export default function SellSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("SellSection");

  // Which photograph the band carries. `null` is the frame before the client
  // knows, and reads as desktop so the markup matches the server's.
  const isMobile = useIsMobile();
  const art = isMobile ? MOBILE_ART : DESKTOP_ART;
  const { imgBottom, carsTop } = geometryOf(art);

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
    // `measure()` caches the viewport height; a retracting address bar changes
    // it without always firing a window resize.
    const offViewport = onViewportChange(onResize);

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
      offViewport();
      window.removeEventListener("scroll", kick);
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
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ background: BLACK }}
    >
      {/* The cars, low on the stage. Oversized and hung off the bottom so the
          art's own margins fall outside the frame; the section clips them. */}
      <div
        ref={imageRef}
        aria-hidden="true"
        className="absolute left-1/2 will-change-transform"
        style={{
          width: `${art.widthVw}vw`,
          bottom: imgBottom,
          zIndex: 0,
          transform: `translateX(-50%) scale(${ZOOM_FROM})`,
          transformOrigin: ZOOM_ORIGIN,
        }}
      >
        {/* Held back until the breakpoint is known, so a phone never downloads
            the 2400px three-car frame on its way to the crop. The band is the
            last thing on the page — nothing is waiting on it. */}
        {isMobile !== null && (
          <Image
            src={art.src}
            alt=""
            width={art.width}
            height={art.height}
            sizes={`${art.widthVw}vw`}
            quality={85}
            className="block h-auto w-full"
          />
        )}
      </div>

      {/* The only gradient: a short black fade at the very top */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[14dvh]"
        style={{ background: "linear-gradient(to bottom, #000 0%, transparent 100%)", zIndex: 1 }}
      />

      {/* Everything above the cars: headline, sub-line, then the two calls to
          action directly under them. The box is exactly the clear black — it
          ends on the roofline — and the stack is centred in it, so however
          the picture is sized the copy sits in the room left over and can
          never run into it. */}
      <div
        /* The phone's header sits over the top of this stage, so the copy keeps
           its own clearance under it rather than centring into it. */
        className="absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-center px-6 py-[1dvh] text-center max-md:pt-[var(--mm-nav-safe)]"
        style={{ height: `calc(100% - ${carsTop})` }}
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
      <div className="absolute inset-x-0 bottom-[2.5dvh] z-10 flex justify-center">
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
