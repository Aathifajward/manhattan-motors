"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CARD_MARGIN_VH,
  COVER,
  OUTRO_DIM as COVER_DIM,
  OUTRO_RISE_VH as COVER_RISE_VH,
  STAGE,
  coverStart,
} from "./scroll/stacked";
import { useIsMobile } from "./scroll/useIsMobile";

/** Only the fields this slide actually renders. */
type SlideVehicle = {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  priceJpy: number;
  mileageKm: number | null;
  fuelType: string | null;
  transmission: string | null;
  images?: { url: string }[];
};

/** Every picture starts pre-zoomed and eases back to 1, never below it — at 1
 *  it exactly fills its container, so no gap can ever show. */
const ZOOM_FROM = 1.12;
/** How far the outgoing picture darkens as the next one covers it. */
const OUTRO_DIM = 0.4;

/* ── Scroll budget ────────────────────────────────────────────────────────
   The height is built from the animation, not the other way round: one
   TRANSITION per slide plus one HOLD per slide, and nothing else. Every vh
   of a transition moves something; the holds are the only still frames in
   the sequence and they are deliberately a fraction of a transition long.

       |<- STAGE ->|<- T ->|<-H->|<- T ->|<-H->| ... |<- COVER ->|
                     ^ slide 0 zooms out   ^ slide 1 arrives
                             ^ slide 0 readable, already settled at 1.0   */

/** The cross-over: the next picture rises and eases 1.12 -> 1.0 while the
 *  outgoing one darkens behind it. All of it animates. */
const TRANSITION_VH = 90;
/** The readable window. The picture is settled at 1.0 for all of it — there
 *  is nothing left waiting to start, so the next transition begins on the
 *  very next pixel of scroll. */
const HOLD_VH = 18;

/** One slide's share of the sequence. */
const SLIDE_VH = TRANSITION_VH + HOLD_VH;
/** Share of that spent in the cross-over; the remainder is the hold. */
const SWITCH = TRANSITION_VH / SLIDE_VH;

/**
 * Stage, then one SLIDE_VH per vehicle, then the COVER pass where DriveEnd
 * rises over this card while it stays pinned, drifting up and darkening.
 * There is no padding anywhere in it: the sequence ends on the frame the
 * last slide's hold ends, which is the frame the cover begins.
 */
const cardVh = (n: number) => STAGE + n * SLIDE_VH + COVER;
const coverStartOf = (n: number) => coverStart(cardVh(n));

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* Forge-scale type. Mobile first, desktop at md. */
const TITLE = "text-[clamp(1.75rem,7vw,2.5rem)] md:text-[clamp(2rem,3.6vw,3.5rem)]";
const PRICE = "text-[clamp(1.1rem,1.5vw,1.5rem)]";
const SPECS = "text-[clamp(0.95rem,1.1vw,1.1rem)]";
const LABEL = "text-[0.75rem] uppercase tracking-[0.2em]";
const BUTTON =
  "font-heading inline-block px-[28px] py-[16px] text-[0.75rem] font-semibold uppercase tracking-widest text-white transition-colors duration-300";

/**
 * One slide's copy. The scrubbed stage and the phone's plain swap move
 * different things around it, but what they move is always this.
 */
function SlideCopy({
  vehicle,
  index,
  total,
}: {
  vehicle: SlideVehicle;
  index: number;
  total: number;
}) {
  const t = useTranslations("VehicleSlides");
  const locale = useLocale();

  const price = new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(vehicle.priceJpy);

  const specs = [
    vehicle.mileageKm && `${vehicle.mileageKm.toLocaleString()} km`,
    vehicle.fuelType,
    vehicle.transmission,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <span className={`mm-meta text-white/40 mb-6 ${LABEL}`}>
        {t("featured")} · {(index + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
      </span>

      <h2
        className={`font-heading mb-5 max-w-[90%] font-medium text-white ${TITLE}`}
        style={{ lineHeight: 1.05, letterSpacing: "-0.01em" }}
      >
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h2>

      <p className={`mm-meta mb-5 text-white/70 ${PRICE}`}>{price}</p>

      <p className={`font-body mb-7 text-white/60 ${SPECS}`}>{specs}</p>

      <div className="flex flex-wrap gap-4">
        <Link href={`/vehicles/${vehicle.slug}`} className={`${BUTTON} border border-white/20 hover:bg-white/5`}>
          {t("viewVehicle")}
        </Link>
        {index === total - 1 && (
          <Link href="/vehicles" className={`${BUTTON} border border-white/20 hover:bg-white/5`}>
            {t("viewAllVehicles")}
          </Link>
        )}
      </div>
    </>
  );
}

export default function VehicleSlides({ vehicles }: { vehicles: SlideVehicle[] }) {
  const t = useTranslations("VehicleSlides");
  const locale = useLocale();

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** The clipped box that rises; overflow hidden keeps the pre-zoom inside it. */
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** The picture inside it — the only thing that scales. */
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  /** Darkens the outgoing picture as the next one covers it. */
  const dimRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** The whole stage, drifting up while DriveEnd covers this card. */
  const driftRef = useRef<HTMLDivElement>(null);
  /** Darkens this card under DriveEnd. */
  const coverDimRef = useRef<HTMLDivElement>(null);

  /**
   * A phone gets no scrubbed transition at all — see the branch below — so the
   * only thing its stage has to know is which vehicle is current.
   */
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky || vehicles.length === 0) return;
    // Neither branch is on screen yet while the breakpoint is unknown.
    if (isMobile === null) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    /**
     * The phone's whole animation. The slides own the same scroll they always
     * did, but instead of a frame loop scrubbing a clip, a zoom and a dim
     * through it, the band the scroll is currently in picks a slide and the
     * markup cross-fades to it on its own. Nothing is written per frame, so
     * there is nothing left to go out of step with the scroll.
     */
    if (isMobile) {
      const N = vehicles.length;
      const COVER_START = coverStartOf(N);

      let frame = 0;
      const read = () => {
        frame = 0;
        const rect = container.getBoundingClientRect();
        const scrollable = rect.height - sticky.offsetHeight;
        const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
        const i = Math.min(N - 1, Math.floor(clamp01(progress / COVER_START) * N));
        // setState bails out on an unchanged value, so this is a no-op for
        // every scroll event that does not actually cross a band.
        setCurrent(i);
      };
      const onScrollOrResize = () => {
        if (!frame) frame = requestAnimationFrame(read);
      };

      read();
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
      };
    }

    let disposed = false;
    let rafId = 0;
    const N = vehicles.length;
    const COVER_START = coverStartOf(N);

    /**
     * Zoom and dim depend only on where `p` sits relative to this slide, so they
     * run straight through the clip/text branching below.
     *
     * Zoom rides the slide's own cross-over — the SWITCH-long window ending at
     * p = i, the same window its clip and text ride — so it eases 1.12 -> 1.0
     * as the picture arrives and is settled for the whole of the hold that
     * follows. Dim rides the next slide's cross-over instead, the window
     * ending at p = i + 1, so the outgoing picture darkens while the incoming
     * one rises and zooms over it. Nothing is left over for the hold.
     */
    const setLook = (i: number, p: number) => {
      const isLast = i === N - 1;

      const img = imageRefs.current[i];
      if (img) {
        const rise = clamp01((p - (i - SWITCH)) / SWITCH);
        const zoom = ZOOM_FROM - (ZOOM_FROM - 1) * rise;
        img.style.transform = `scale(${zoom.toFixed(4)})`;
      }

      const dim = dimRefs.current[i];
      if (dim) {
        // The last slide is never covered, so it never darkens.
        const t = isLast ? 0 : clamp01((p - (i + 1 - SWITCH)) / SWITCH);
        dim.style.opacity = (OUTRO_DIM * t).toFixed(4);
      }
    };

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      // The sequence fills everything before the cover, one SLIDE_VH each.
      // Offset by SWITCH so slide 0 opens inside a cross-over of its own: it
      // is fully shown from the first frame (see the p <= 0 branch below) and
      // spends that window zooming out, rather than sitting still.
      const p = clamp01(progress / COVER_START) * N - SWITCH; // -SWITCH to N - SWITCH

      // Being covered by DriveEnd: the whole stage drifts up and darkens.
      const outro = clamp01((progress - COVER_START) / (1 - COVER_START));
      if (driftRef.current) {
        driftRef.current.style.transform =
          `translate3d(0, ${(-COVER_RISE_VH * outro).toFixed(3)}vh, 0)`;
      }
      if (coverDimRef.current) {
        coverDimRef.current.style.opacity = (COVER_DIM * outro).toFixed(4);
      }

      for (let i = 0; i < N; i++) {
        const textEl = textRefs.current[i];
        const frameEl = frameRefs.current[i];
        const isLast = i === N - 1;

        setLook(i, p);

        if (i === 0 && p <= 0) {
          // Before scroll — the first slide opens pre-zoomed at 1.12.
          if (textEl) {
            textEl.style.opacity = "1";
            textEl.style.transform = "translateY(0)";
            textEl.style.pointerEvents = "auto";
          }
          if (frameEl) frameEl.style.clipPath = "inset(0 0 0 0)";
          continue;
        }

        if (p < i - SWITCH) {
          // Still ahead: parked below, nothing shown.
          if (textEl) {
            textEl.style.opacity = "0";
            textEl.style.transform = "translateY(60vh)";
            textEl.style.pointerEvents = "none";
          }
          if (frameEl) frameEl.style.clipPath = "inset(100% 0 0 0)";
        } else if (p >= i - SWITCH && p < i) {
          // Rising in behind a hard edge, still pre-zoomed at 1.12.
          const tProg = (p - (i - SWITCH)) / SWITCH;
          if (textEl) {
            textEl.style.opacity = String(tProg);
            textEl.style.transform = `translateY(${60 * (1 - tProg)}vh)`;
            textEl.style.pointerEvents = tProg === 1 ? "auto" : "none";
          }
          if (frameEl) {
            frameEl.style.clipPath = `inset(${(1 - tProg) * 100}% 0 0 0)`;
            frameEl.style.zIndex = String(10 + i);
          }
        } else if (p >= i && p <= i + (1 - SWITCH)) {
          // Holding.
          if (textEl) {
            textEl.style.opacity = "1";
            textEl.style.transform = "translateY(0)";
            textEl.style.pointerEvents = "auto";
          }
          if (frameEl) {
            frameEl.style.clipPath = "inset(0 0 0 0)";
            frameEl.style.zIndex = String(10 + i);
          }
        } else if (p > i + (1 - SWITCH) && p < i + 1) {
          // The next one is rising over this one.
          if (isLast) {
            // The last slide has no outro.
            if (textEl) {
              textEl.style.opacity = "1";
              textEl.style.transform = "translateY(0)";
              textEl.style.pointerEvents = "auto";
            }
            if (frameEl) frameEl.style.clipPath = "inset(0 0 0 0)";
          } else {
            const tProg = (p - (i + (1 - SWITCH))) / SWITCH;
            if (textEl) {
              textEl.style.opacity = String(1 - tProg);
              textEl.style.transform = `translateY(${-60 * tProg}vh)`;
              textEl.style.pointerEvents = "none";
            }
            if (frameEl) {
              frameEl.style.clipPath = "inset(0 0 0 0)";
              frameEl.style.zIndex = String(i); // stays underneath the incoming one
            }
          }
        } else {
          // Behind us.
          if (isLast) {
            if (textEl) {
              textEl.style.opacity = "1";
              textEl.style.transform = "translateY(0)";
              textEl.style.pointerEvents = "auto";
            }
            if (frameEl) frameEl.style.clipPath = "inset(0 0 0 0)";
          } else {
            if (textEl) {
              textEl.style.opacity = "0";
              textEl.style.transform = "translateY(-60vh)";
              textEl.style.pointerEvents = "none";
            }
            if (frameEl) {
              frameEl.style.clipPath = "inset(0 0 0 0)";
              frameEl.style.zIndex = String(i);
            }
          }
        }
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
  }, [vehicles.length, isMobile]);

  if (vehicles.length === 0) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  const specsOf = (v: SlideVehicle) =>
    [v.mileageKm && `${v.mileageKm.toLocaleString()} km`, v.fuelType, v.transmission]
      .filter(Boolean)
      .join(" · ");

  if (prefersReducedMotion) {
    return (
      <section
        className="w-full bg-[var(--mm-navy)] py-20 px-6"
        /* No stage to cover, so DriveEnd's -200vh pull-up has nothing to eat
           into here — give it back, or it would swallow the last two slides. */
        style={{ marginBottom: `${-CARD_MARGIN_VH}vh` }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {vehicles.map((v, i) => (
            <div key={v.id} className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-[45%] flex flex-col items-start">
                <span className={`mm-meta text-white/40 mb-6 ${LABEL}`}>
                  {t("featured")} · {(i + 1).toString().padStart(2, "0")} / {vehicles.length.toString().padStart(2, "0")}
                </span>
                <h2
                  className={`font-heading mb-5 max-w-[90%] font-medium text-white ${TITLE}`}
                  style={{ lineHeight: 1.05, letterSpacing: "-0.01em" }}
                >
                  {v.year} {v.make} {v.model}
                </h2>
                <p className={`mm-meta mb-5 text-white/70 ${PRICE}`}>{priceFormatter.format(v.priceJpy)}</p>
                <p className={`font-body mb-7 text-white/60 ${SPECS}`}>{specsOf(v)}</p>
                <div className="flex flex-wrap gap-4">
                  <Link href={`/vehicles/${v.slug}`} className={`${BUTTON} border border-white/20 hover:bg-white/5`}>
                    {t("viewVehicle")}
                  </Link>
                  {i === vehicles.length - 1 && (
                    <Link href="/vehicles" className={`${BUTTON} border border-[#2D7FF9] !text-[#2D7FF9] hover:bg-white/5`}>
                      {t("viewAllVehicles")}
                    </Link>
                  )}
                </div>
              </div>
              <div className="w-full md:w-[55%] h-[50svh] md:h-[600px] bg-[var(--mm-navy)]">
                {v.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.images[0].url} alt={v.model} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ── The phone ────────────────────────────────────────────────────────────
     Same stage, same scroll budget, none of the motion. A scrubbed cross-over
     on a phone is a transform, a clip-path and an opacity rewritten on every
     one of a touch scroll's frames, against a scroll position the browser is
     already animating itself — which is what made the change between vehicles
     read as a glitch rather than as a transition. So there is no cross-over
     here: the band the scroll is in picks a vehicle and the markup fades to
     it, and the only thing that moves is an opacity CSS owns. The desktop
     stage below is untouched.                                              */
  if (isMobile) {
    return (
      <section
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${cardVh(vehicles.length)}vh`, zIndex: 10 }}
      >
        <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[var(--mm-navy)]">
          {/* Reversed, so the picture takes the top half and the copy the
              bottom — the same arrangement the stage has at this width. */}
          <div className="absolute inset-0 flex flex-col-reverse">

            {/* Copy — the larger half, because the last slide carries two
                buttons and they wrap at this width. The header is nowhere near
                it here, so it takes ordinary padding rather than the stage's
                header gap. */}
            <div className="relative h-[55svh] w-full bg-[var(--mm-navy)] z-20">
              {vehicles.map((v, i) => (
                <div
                  key={v.id}
                  className="absolute inset-0 flex flex-col justify-center items-start px-6 py-8 bg-[var(--mm-navy)] transition-opacity duration-300 ease-out"
                  style={{
                    opacity: i === current ? 1 : 0,
                    pointerEvents: i === current ? "auto" : "none",
                  }}
                >
                  <SlideCopy vehicle={v} index={i} total={vehicles.length} />
                </div>
              ))}
            </div>

            {/* Picture — the rest of the stage, edge to edge. No zoom, no clip. */}
            <div className="relative h-[45svh] w-full bg-[var(--mm-navy)] z-10">
              {vehicles.map((v, i) => (
                <div
                  key={v.id}
                  className="absolute inset-0 overflow-hidden bg-[var(--mm-navy)] transition-opacity duration-300 ease-out"
                  style={{ opacity: i === current ? 1 : 0 }}
                >
                  {v.images?.[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.images[0].url}
                      alt={v.model}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${cardVh(vehicles.length)}vh`, zIndex: 10 }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[var(--mm-navy)]">
        <div
          ref={driftRef}
          className="absolute inset-0 flex flex-col-reverse md:flex-row will-change-transform"
        >

        {/* Left Column: Text */}
        <div className="w-full h-[50svh] md:h-[100svh] md:w-1/2 flex flex-col justify-center relative bg-[var(--mm-navy)] z-20">
          {vehicles.map((v, i) => (
            <div
              key={v.id}
              ref={(el) => { textRefs.current[i] = el; }}
              /* pt keeps the label clear of the fixed header. */
              className="absolute inset-0 flex flex-col justify-center items-start px-6 pt-[120px] pb-10 md:pl-[180px] md:pr-12 will-change-transform bg-[var(--mm-navy)] md:bg-transparent"
              style={{ opacity: i === 0 ? 1 : 0, transform: i === 0 ? "translateY(0)" : "translateY(60vh)", pointerEvents: i === 0 ? "auto" : "none" }}
            >
              <SlideCopy vehicle={v} index={i} total={vehicles.length} />
            </div>
          ))}
        </div>

        {/* Right Column: Images — edge to edge */}
        <div className="w-full h-[50svh] md:h-[100svh] md:w-1/2 relative bg-[var(--mm-navy)] z-10">
          {vehicles.map((v, i) => (
            <div
              key={v.id}
              ref={(el) => { frameRefs.current[i] = el; }}
              /* Overflow hidden + the section's own background, so the outgoing
                 shrink never shows a gap at the edges. */
              className="absolute inset-0 overflow-hidden bg-[var(--mm-navy)]"
              style={{
                clipPath: i === 0 ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                zIndex: i === 0 ? 10 : 0,
              }}
            >
              {v.images?.[0]?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={(el) => { imageRefs.current[i] = el; }}
                  src={v.images[0].url}
                  alt={v.model}
                  className="absolute inset-0 h-full w-full object-cover will-change-transform"
                  style={{ transform: `scale(${ZOOM_FROM})`, transformOrigin: "center" }}
                />
              )}
              <div
                ref={(el) => { dimRefs.current[i] = el; }}
                aria-hidden="true"
                className="absolute inset-0 bg-black"
                style={{ opacity: 0 }}
              />
            </div>
          ))}
        </div>

        </div>

        {/* Darkens while DriveEnd rises over this card */}
        <div
          ref={coverDimRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-black"
          style={{ opacity: 0 }}
        />
      </div>
    </section>
  );
}
