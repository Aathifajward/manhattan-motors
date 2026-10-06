"use client";

import { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useScrollProgress } from "./useScrollProgress";

export default function StatementReveal() {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);
  
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

    // 0.60-1.00: logos slide horizontally
    if (logosRef.current) {
      const logosOpacity = p <= 0.6 ? 0 : p >= 0.8 ? 1 : (p - 0.6) / 0.2;
      const logosTranslate = p <= 0.6 ? 100 : 100 - (100 * ((p - 0.6) / 0.4));
      logosRef.current.style.opacity = String(logosOpacity);
      logosRef.current.style.transform = `translateX(${logosTranslate}px)`;
    }
  }, []);

  useScrollProgress(containerRef, stickyRef, onProgress);

  return (
    <section ref={containerRef} className="relative w-full h-[250vh] md:h-[300vh] bg-[#0A0E14]">
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex items-center justify-center">
        
        {/* Full Viewport Image Layer */}
        <div 
          ref={imageRef} 
          className="absolute inset-0 w-full h-full will-change-transform flex items-center justify-center origin-center"
          style={{ opacity: 0, transform: "scale(0.3)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/sections/statement.webp" 
            alt="Statement"
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
          className="font-heading text-center font-normal leading-tight text-[clamp(2rem,6vw,5rem)] text-white z-10 w-full px-6 absolute top-1/2 left-1/2 will-change-transform"
          style={{ opacity: 0, transform: "translate(-50%, -50%)" }}
        >
          {t("headlineLine1")}<br />{t("headlineLine2")}
        </h2>
        
        {/* Secondary Content & Button (Bottom Right) */}
        <div 
          ref={contentRef}
          className="absolute bottom-1/4 right-6 md:right-24 lg:right-32 flex flex-col items-end text-right z-20 will-change-transform max-w-sm"
          style={{ opacity: 0, transform: "translateY(30px)" }}
        >
          <p className="text-white text-[clamp(1rem,2vw,1.25rem)] mb-6 opacity-90 leading-relaxed font-sans">
            {t("paragraph")}
          </p>
          <button className="px-8 py-3 bg-[#2D7FF9] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300">
            {t("startProject")}
          </button>
        </div>

        {/* Logos sliding row */}
        <div 
          ref={logosRef}
          className="absolute bottom-12 left-0 w-full flex items-center gap-12 px-6 overflow-visible z-20 will-change-transform opacity-50"
          style={{ opacity: 0, transform: "translateX(100px)" }}
        >
          {["Toyota", "Nissan", "Honda", "Mazda", "Subaru"].map(logo => (
            <span key={logo} className="text-white font-bold uppercase tracking-[0.2em] text-sm md:text-base opacity-70 whitespace-nowrap">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
