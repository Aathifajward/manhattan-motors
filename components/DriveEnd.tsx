"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function DriveEnd() {
  const t = useTranslations("DriveEnd");
  
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const gtrWrapperRef = useRef<HTMLDivElement>(null);
  const velfireLeftRef = useRef<HTMLDivElement>(null);
  const velfireRightRef = useRef<HTMLDivElement>(null);
  
  const startTextRef = useRef<HTMLDivElement>(null);
  const endTextRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      if (startTextRef.current) startTextRef.current.style.opacity = "0";
      if (gtrWrapperRef.current) gtrWrapperRef.current.style.transform = "translate3d(0, -200%, 0)";
      if (velfireLeftRef.current) velfireLeftRef.current.style.transform = "translate3d(0, -200%, 0)";
      if (velfireRightRef.current) velfireRightRef.current.style.transform = "translate3d(0, -200%, 0)";
      if (endTextRef.current) endTextRef.current.style.transform = "translate3d(-50%, -50%, 0)";
      return;
    }

    let disposed = false;
    let rafId = 0;

    const tick = () => {
      rafId = 0;
      if (disposed) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }

      const wh = window.innerHeight;

      // GTR (1.0x speed, ends at 0.85)
      const gProg = Math.min(1, Math.max(0, progress / 0.85));
      if (gtrWrapperRef.current) {
        const wrapperH = gtrWrapperRef.current.offsetHeight;
        const wrapperY = wh - gProg * (wh + wrapperH);
        gtrWrapperRef.current.style.transform = `translate3d(0, ${wrapperY}px, 0)`;

        // End Text (starts under rear bumper, slides out slowly and stops at 50vh)
        if (endTextRef.current) {
          const textLocalY = gProg * (wh * 0.5 + wrapperH * 0.1);
          endTextRef.current.style.transform = `translate3d(-50%, calc(-50% + ${textLocalY}px), 0)`;
        }
      }
      
      // Left Velfire (1.25x speed, starts at 0.15, ends around 0.83)
      const leftProg = Math.min(1, Math.max(0, (progress - 0.15) * 1.47));
      if (velfireLeftRef.current) {
        const vH = velfireLeftRef.current.offsetHeight;
        const leftY = wh - leftProg * (wh + vH);
        velfireLeftRef.current.style.transform = `translate3d(0, ${leftY}px, 0)`;
      }
      
      // Right Velfire (1.4x speed, starts at 0.25, ends around 0.85)
      const rightProg = Math.min(1, Math.max(0, (progress - 0.25) * 1.646));
      if (velfireRightRef.current) {
        const vH = velfireRightRef.current.offsetHeight;
        const rightY = wh - rightProg * (wh + vH);
        velfireRightRef.current.style.transform = `translate3d(0, ${rightY}px, 0)`;
      }

      // Start text fade out (while covered by cars, 0.40 to 0.50)
      if (startTextRef.current) {
        const startProg = Math.min(1, Math.max(0, (progress - 0.4) / 0.1));
        startTextRef.current.style.opacity = String(1 - startProg);
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
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-[700vh] md:h-[900vh] bg-[var(--mm-navy)]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex justify-center bg-[var(--mm-navy)]">
        
        {/* Start Text (BEHIND CARS) */}
        <div className="absolute inset-0 flex flex-col items-center text-center px-6 z-10 pointer-events-none">
          <div 
            ref={startTextRef} 
            className="absolute w-full flex flex-col items-center justify-center will-change-[opacity]" 
            style={{ top: "35%" }}
          >
            <h2 className="font-heading text-white leading-[1.1]" style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>
              <span className="block">{t("headline1a")}</span>
              {t("headline1b") && <span className="block">{t("headline1b")}</span>}
            </h2>
          </div>
        </div>

        {/* Cars Layer (IN FRONT OF TEXT) */}
        <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none z-20">
          
          {/* Left Velfire */}
          <div 
            ref={velfireLeftRef}
            className="absolute left-0 top-0 w-[90vw] md:w-[45vw] aspect-[1/2] will-change-transform -translate-x-[50%]"
          >
            <Image 
              src="/images/velfire-trimmed.png" 
              alt="Velfire Left" 
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Right Velfire */}
          <div 
            ref={velfireRightRef}
            className="absolute right-0 top-0 w-[90vw] md:w-[45vw] aspect-[1/2] will-change-transform translate-x-[50%]"
          >
            <Image 
              src="/images/velfire-trimmed.png" 
              alt="Velfire Right" 
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Center GTR Wrapper (Contains GTR and End Text) */}
          <div 
            ref={gtrWrapperRef}
            className="absolute top-0 w-[90vw] md:w-[42vw] aspect-[1/2] will-change-transform"
          >
            {/* End Text (Behind the GTR, inside the wrapper) */}
            <div 
              ref={endTextRef}
              className="absolute w-[100vw] flex flex-col items-center justify-center text-center will-change-transform z-0"
              style={{ top: "90%", left: "50%", transform: "translate(-50%, -50%)", opacity: 1 }}
            >
              <h2 className="font-heading text-white leading-tight whitespace-nowrap" style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>
                {t("headline2")}
              </h2>
            </div>
            
            {/* GTR Image (In Front of End Text) */}
            <div className="relative w-full h-full z-10">
              <Image 
                src="/images/gtr-trimmed.png" 
                alt="GTR" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-40">
          <div ref={progressRef} className="h-full w-full bg-white origin-left will-change-transform scale-x-0" />
        </div>

      </div>
    </section>
  );
}
