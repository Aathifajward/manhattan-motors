"use client";

import { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useScrollProgress } from "./useScrollProgress";

/** The four steps shown at the end of the section — order defines the stagger. */
const SERVICES = ["appraisal", "offer", "prep", "handover"] as const;

/** Full-viewport photo the headline zooms into. */
const STATEMENT_IMAGE = "/images/frames/frame_000040.webp";

export default function StatementReveal() {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const serviceRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const t = useTranslations("Statement");

  const onProgress = useCallback((p: number) => {
    // 0.00-0.20: headline fades in
    if (headlineRef.current) {
      const headlineOpacity = p <= 0 ? 0 : p >= 0.2 ? 1 : p / 0.2;
      // 0.60-1.00: headline drifts up and fades out
      const headlineFadeOut = p >= 0.6 ? 1 - ((p - 0.6) / 0.4) : 1;
      const headlineTranslate = p >= 0.6 ? -50 * ((p - 0.6) / 0.4) : 0;
      
      headlineRef.current.style.opacity = String(Math.min(headlineOpacity, headlineFadeOut));
      headlineRef.current.style.transform = `translate(-50%, calc(-50% + ${headlineTranslate}px))`;
    }

    // 0.15-0.65: image grows from 0.3 to 1.0
    if (imageRef.current) {
      let scale = 0.3;
      if (p >= 0.15 && p <= 0.65) {
        scale = 0.3 + 0.7 * ((p - 0.15) / 0.5);
      } else if (p > 0.65) {
        scale = 1;
      }
      
      const imageOpacity = p <= 0.15 ? 0 : p >= 0.25 ? 1 : (p - 0.15) / 0.1;
      
      imageRef.current.style.transform = `scale(${scale})`;
      imageRef.current.style.opacity = String(imageOpacity);
    }
    
    // overlay darkens slightly more when content appears
    if (overlayRef.current) {
      const overlayOpacity = p >= 0.6 ? 0.6 : 0.3; // Base overlay 0.3, darkens to 0.6
      overlayRef.current.style.opacity = String(overlayOpacity);
    }

    // 0.60-1.00: short paragraph and button fade in on the right
    if (contentRef.current) {
      const contentOpacity = p <= 0.6 ? 0 : p >= 0.8 ? 1 : (p - 0.6) / 0.2;
      const contentTranslate = p <= 0.6 ? 30 : p >= 0.8 ? 0 : 30 * (1 - ((p - 0.6) / 0.2));
      contentRef.current.style.opacity = String(contentOpacity);
      contentRef.current.style.transform = `translateY(${contentTranslate}px)`;
    }

    // 0.70-1.00: the four service items slide up one after the other
    serviceRefs.current.forEach((el, i) => {
      if (!el) return;
      const start = 0.7 + i * 0.055;
      const local = Math.min(1, Math.max(0, (p - start) / 0.11));
      el.style.opacity = String(local);
      el.style.transform = `translateY(${24 * (1 - local)}px)`;
    });
  }, []);

  useScrollProgress(containerRef, stickyRef, onProgress);

  return (
    <section ref={containerRef} className="relative w-full h-[250vh] md:h-[300vh] bg-[#0A0E14]">
      <div ref={stickyRef} className="sticky top-0 h-[100dvh] w-full overflow-hidden flex items-center justify-center">
        
        {/* Full Viewport Image Layer */}
        <div 
          ref={imageRef} 
          className="absolute inset-0 w-full h-full will-change-transform flex items-center justify-center origin-center"
          style={{ opacity: 0, transform: "scale(0.3)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={STATEMENT_IMAGE} 
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.background = 'linear-gradient(45deg, #1A2433, #0A0E14)';
            }}
          />
          {/* Dark overlay */}
          <div ref={overlayRef} className="absolute inset-0 bg-black transition-opacity duration-300" style={{ opacity: 0.3 }} />
        </div>

        {/* Headline */}
        <h2 
          ref={headlineRef}
          className="font-heading text-center font-medium leading-tight text-[clamp(2rem,6vw,5rem)] text-white z-10 w-full px-6 absolute top-1/2 left-1/2 will-change-transform"
          style={{ opacity: 0, transform: "translate(-50%, -50%)" }}
        >
          {t("headlineLine1")}<br />{t("headlineLine2")}
        </h2>
        
        {/* Secondary Content & Button (Bottom Right) */}
        <div 
          ref={contentRef}
          className="absolute bottom-[38%] md:bottom-1/4 right-6 md:right-24 lg:right-32 flex flex-col items-end text-right z-20 will-change-transform max-w-sm"
          style={{ opacity: 0, transform: "translateY(30px)" }}
        >
          <p className="mm-body-copy mb-6">
            {t("paragraph")}
          </p>
          <Link
            href={{ pathname: "/contact", query: { type: "sell" } }}
            className="px-8 py-3 bg-[#2D7FF9] font-heading font-semibold text-white uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300"
          >
            {t("sellCta")}
          </Link>
        </div>

        {/* Service steps — slide up one by one at the end of the scroll */}
        <div className="absolute bottom-8 left-0 w-full px-6 md:px-12 z-20 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 md:gap-8">
          {SERVICES.map((key, i) => (
            <div
              key={key}
              ref={(el) => { serviceRefs.current[i] = el; }}
              className="will-change-transform"
              style={{ opacity: 0, transform: "translateY(24px)" }}
            >
              <span className="mm-meta block text-[#2D7FF9] text-xs tracking-[0.2em] mb-1.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-white text-sm md:text-base leading-snug mb-1">
                {t(`services.${key}.title`)}
              </h3>
              <p className="font-body text-white/60 text-xs md:text-sm leading-snug">
                {t(`services.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
