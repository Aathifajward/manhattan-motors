"use client";

import { useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function VehicleSlides({ vehicles }: { vehicles: any[] }) {
  const t = useTranslations("VehicleSlides");
  const locale = useLocale();

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky || vehicles.length === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    let disposed = false;
    let rafId = 0;
    const N = vehicles.length;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      
      const p = progress * N; // 0 to N

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }

      for (let i = 0; i < N; i++) {
        const textEl = textRefs.current[i];
        const imgEl = imageRefs.current[i];
        if (!textEl || !imgEl) continue;

        if (i === 0 && p <= 0) {
          // Before scroll
          textEl.style.opacity = "1";
          textEl.style.transform = "translateY(0)";
          textEl.style.pointerEvents = "auto";
          imgEl.style.clipPath = "inset(0 0 0 0)";
          continue;
        }

        if (p < i - 0.4) {
          // Slide is way in the future
          textEl.style.opacity = "0";
          textEl.style.transform = "translateY(60vh)";
          textEl.style.pointerEvents = "none";
          imgEl.style.clipPath = "inset(100% 0 0 0)";
        } else if (p >= i - 0.4 && p < i) {
          // Incoming transition (from i - 0.4 to i)
          const tProg = (p - (i - 0.4)) / 0.4;
          textEl.style.opacity = String(tProg);
          textEl.style.transform = `translateY(${60 * (1 - tProg)}vh)`;
          textEl.style.pointerEvents = tProg === 1 ? "auto" : "none";
          
          imgEl.style.clipPath = `inset(${(1 - tProg) * 100}% 0 0 0)`;
          imgEl.style.zIndex = String(10 + i);
        } else if (p >= i && p <= i + 0.6) {
          // Holding
          textEl.style.opacity = "1";
          textEl.style.transform = "translateY(0)";
          textEl.style.pointerEvents = "auto";
          imgEl.style.clipPath = "inset(0 0 0 0)";
          imgEl.style.zIndex = String(10 + i);
        } else if (p > i + 0.6 && p < i + 1) {
          // Outgoing transition (from i + 0.6 to i + 1)
          if (i === N - 1) {
            textEl.style.opacity = "1";
            textEl.style.transform = "translateY(0)";
            textEl.style.pointerEvents = "auto";
            imgEl.style.clipPath = "inset(0 0 0 0)";
          } else {
            const tProg = (p - (i + 0.6)) / 0.4;
            textEl.style.opacity = String(1 - tProg);
            textEl.style.transform = `translateY(${-60 * tProg}vh)`;
            textEl.style.pointerEvents = "none";
            
            imgEl.style.clipPath = "inset(0 0 0 0)";
            imgEl.style.zIndex = String(i); // Stay underneath incoming image
          }
        } else {
          // Way in the past
          if (i === N - 1) {
            textEl.style.opacity = "1";
            textEl.style.transform = "translateY(0)";
            textEl.style.pointerEvents = "auto";
            imgEl.style.clipPath = "inset(0 0 0 0)";
          } else {
            textEl.style.opacity = "0";
            textEl.style.transform = "translateY(-60vh)";
            textEl.style.pointerEvents = "none";
            imgEl.style.clipPath = "inset(0 0 0 0)";
            imgEl.style.zIndex = String(i);
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

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  if (prefersReducedMotion) {
    return (
      <section className="w-full bg-[var(--mm-navy)] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
          {vehicles.map((v, i) => (
            <div key={v.id} className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-[45%] flex flex-col items-start gap-4">
                <span className="text-white/40 text-xs font-bold tracking-widest uppercase">
                  {t("featured")} • {(i + 1).toString().padStart(2, "0")} / {vehicles.length.toString().padStart(2, "0")}
                </span>
                <h2 className="font-heading text-4xl text-white">{v.year} {v.make} {v.model}</h2>
                <div className="text-white/60 text-sm space-y-1">
                  <p>{[v.mileageKm && `${v.mileageKm.toLocaleString()} km`, v.fuelType, v.transmission].filter(Boolean).join(" · ")}</p>
                  <p className="text-white text-xl font-bold mt-2">{priceFormatter.format(v.priceJpy)}</p>
                </div>
                <Link href={`/vehicles/${v.slug}`} className="mt-4 px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors">
                  {t("viewVehicle")}
                </Link>
                {i === vehicles.length - 1 && (
                  <Link href="/vehicles" className="mt-2 px-8 py-4 border border-[#2D7FF9] text-[#2D7FF9] font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors">
                    {t("viewAllVehicles")}
                  </Link>
                )}
              </div>
              <div className="w-full md:w-[55%] h-[50svh] md:h-[600px] rounded-xl overflow-hidden">
                {v.images?.[0]?.url && (
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
    <section ref={containerRef} className="relative w-full" style={{ height: `${(vehicles.length + 1) * 100}vh` }}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col-reverse md:flex-row bg-[var(--mm-navy)]">
        
        {/* Left Column: Text */}
        <div className="w-full h-[50svh] md:h-[100svh] md:w-1/2 flex flex-col justify-center relative bg-[var(--mm-navy)] z-20">
          {vehicles.map((v, i) => (
            <div 
              key={v.id} 
              ref={(el) => { textRefs.current[i] = el; }}
              className="absolute inset-0 flex flex-col justify-center items-start px-6 md:pl-[180px] md:pr-12 will-change-transform bg-[var(--mm-navy)] md:bg-transparent"
              style={{ opacity: i === 0 ? 1 : 0, transform: i === 0 ? "translateY(0)" : "translateY(60vh)", pointerEvents: i === 0 ? "auto" : "none" }}
            >
              <span className="text-white/40 text-xs font-bold tracking-widest mb-6 uppercase">
                {t("featured")} · {(i + 1).toString().padStart(2, "0")} / {vehicles.length.toString().padStart(2, "0")}
              </span>
              <h2 className="font-heading text-white leading-[1.1] mb-2" style={{ fontSize: "clamp(42px, 8vw, 120px)" }}>
                {v.year} {v.make} {v.model}
              </h2>
              <p className="text-white/70 text-lg md:text-xl font-medium mb-8">
                {priceFormatter.format(v.priceJpy)}
              </p>
              <p className="text-white/60 text-base md:text-[20px] mb-12 font-sans">
                {[v.mileageKm && `${v.mileageKm.toLocaleString()} km`, v.fuelType, v.transmission].filter(Boolean).join(" · ")}
              </p>
              <div className="flex gap-4">
                <Link href={`/vehicles/${v.slug}`} className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors duration-300">
                  {t("viewVehicle")}
                </Link>
                {i === vehicles.length - 1 && (
                  <Link href="/vehicles" className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors duration-300">
                    {t("viewAllVehicles")}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Images */}
        <div className="w-full h-[50svh] md:h-[100svh] md:w-1/2 relative bg-[var(--mm-navy)] z-10">
          {vehicles.map((v, i) => (
            <img 
              key={v.id}
              ref={(el) => { imageRefs.current[i] = el; }}
              src={v.images?.[0]?.url || "/images/frames/frame_000000.webp"}
              alt={v.model}
              className="absolute inset-0 w-full h-full object-cover will-change-transform"
              style={{
                clipPath: i === 0 ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                zIndex: i === 0 ? 10 : 0
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <div ref={progressRef} className="h-full w-full bg-white origin-left will-change-transform scale-x-0" />
        </div>

      </div>
    </section>
  );
}
