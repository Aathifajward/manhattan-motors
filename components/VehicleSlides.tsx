"use client";

import { useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

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
/** Share of a slide spent in the cross-over. */
const SWITCH = 0.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* Forge-scale type. Mobile first, desktop at md. */
const TITLE = "text-[clamp(1.75rem,7vw,2.5rem)] md:text-[clamp(2rem,3.6vw,3.5rem)]";
const PRICE = "text-[clamp(1.1rem,1.5vw,1.5rem)]";
const SPECS = "text-[clamp(0.95rem,1.1vw,1.1rem)]";
const LABEL = "text-[0.75rem] uppercase tracking-[0.2em]";
const BUTTON =
  "font-heading inline-block px-[28px] py-[16px] text-[0.75rem] font-semibold uppercase tracking-widest text-white transition-colors duration-300";

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

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky || vehicles.length === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let disposed = false;
    let rafId = 0;
    const N = vehicles.length;

    /**
     * Zoom and dim depend only on where `p` sits relative to this slide, so they
     * run straight through the clip/text branching below.
     *
     * Zoom holds at 1.12 while the slide is still rising (p < i), then eases to
     * 1.0 across its active-and-being-covered span (p = i -> i + 1). The last
     * slide is never covered, so it simply holds its pre-zoom.
     */
    const setLook = (i: number, p: number) => {
      const isLast = i === N - 1;

      const img = imageRefs.current[i];
      if (img) {
        const zoom = isLast ? ZOOM_FROM : ZOOM_FROM - (ZOOM_FROM - 1) * clamp01(p - i);
        img.style.transform = `scale(${zoom.toFixed(4)})`;
      }

      const dim = dimRefs.current[i];
      if (dim) {
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

      const p = progress * N; // 0 to N

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
  }, [vehicles.length]);

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
      <section className="w-full bg-[var(--mm-navy)] py-20 px-6">
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

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${(vehicles.length + 1) * 100}vh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col-reverse md:flex-row bg-[var(--mm-navy)]">

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
              <span className={`mm-meta text-white/40 mb-6 ${LABEL}`}>
                {t("featured")} · {(i + 1).toString().padStart(2, "0")} / {vehicles.length.toString().padStart(2, "0")}
              </span>

              <h2
                className={`font-heading mb-5 max-w-[90%] font-medium text-white ${TITLE}`}
                style={{ lineHeight: 1.05, letterSpacing: "-0.01em" }}
              >
                {v.year} {v.make} {v.model}
              </h2>

              <p className={`mm-meta mb-5 text-white/70 ${PRICE}`}>
                {priceFormatter.format(v.priceJpy)}
              </p>

              <p className={`font-body mb-7 text-white/60 ${SPECS}`}>
                {specsOf(v)}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href={`/vehicles/${v.slug}`} className={`${BUTTON} border border-white/20 hover:bg-white/5`}>
                  {t("viewVehicle")}
                </Link>
                {i === vehicles.length - 1 && (
                  <Link href="/vehicles" className={`${BUTTON} border border-white/20 hover:bg-white/5`}>
                    {t("viewAllVehicles")}
                  </Link>
                )}
              </div>
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
    </section>
  );
}
