"use client";

import { useEffect, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function WordReveal() {
  const t = useTranslations("WordReveal");
  const locale = useLocale();
  const text = t("sentence");
  const caption = t("caption");

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Split into segments (words or Japanese character chunks)
  const segments = useMemo(() => {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
      return Array.from(segmenter.segment(text)).map(s => s.segment);
    } catch {
      // Fallback if Intl.Segmenter is not available
      return locale === "ja" ? text.split("") : text.split(" ");
    }
  }, [text, locale]);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const imgWrap = imageWrapRef.current;
    const img = imageRef.current;
    if (!container || !sticky) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Set to final states and skip animation loop
      wordsRef.current.forEach(el => {
        if (el) el.style.opacity = "1";
      });
      if (imgWrap) imgWrap.style.transform = "translateY(0)";
      if (img) img.style.transform = "scale(1)";
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

      // 1. Words opacity (0.05 to 0.85)
      const wordStart = 0.05;
      const wordEnd = 0.85;
      const totalWords = wordsRef.current.length;
      
      wordsRef.current.forEach((el, idx) => {
        if (!el) return;
        const start = wordStart + (idx / totalWords) * (wordEnd - wordStart);
        const windowSize = (wordEnd - wordStart) / totalWords * 3; // overlap fade
        const end = Math.min(wordEnd, start + windowSize);
        
        let wordProgress = 0;
        if (progress >= end) {
          wordProgress = 1;
        } else if (progress > start) {
          wordProgress = (progress - start) / (end - start);
        }
        
        const opacity = 0.15 + 0.85 * wordProgress;
        el.style.opacity = String(opacity);
      });

      // 2. Parallax Image
      // Full progress range up to 0.90, then hold
      const pProgress = Math.min(1, progress / 0.90);
      
      if (imgWrap && img) {
        // translateY from +25vh to -15vh
        imgWrap.style.transform = `translateY(${25 - 40 * pProgress}vh)`;
        
        // scale 1.08 to 1.0
        const scale = 1.08 - 0.08 * pProgress;
        img.style.transform = `scale(${scale})`;
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
  }, [segments.length]);

  return (
    <section ref={containerRef} className="relative w-full h-[300vh] sm:h-[250vh]" style={{ backgroundColor: "var(--mm-navy)" }}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col md:flex-row items-center justify-center md:justify-between px-6 py-12 md:py-20 max-w-7xl mx-auto gap-8 md:gap-12">
        
        {/* Left: Text */}
        <div className="w-full md:w-[60%] flex flex-col justify-center">
          <h2 className="font-heading text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.3] text-white">
            {segments.map((segment, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordsRef.current[i] = el;
                }}
                className="will-change-[opacity]"
                style={{ opacity: 0.15 }}
              >
                {segment}
              </span>
            ))}
          </h2>
        </div>

        {/* Right: Parallax Image */}
        <div className="w-full md:w-[35%] flex flex-col items-center md:items-end">
          <div 
            ref={imageWrapRef} 
            className="w-full max-w-xs md:max-w-sm aspect-[3/4] rounded-xl overflow-hidden border border-white/20 shadow-2xl will-change-transform"
          >
            <img 
              ref={imageRef}
              src="/images/frames/frame_000080.webp" 
              alt={caption}
              className="w-full h-full object-cover will-change-transform"
            />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-center md:text-right" style={{ color: "rgba(255,255,255,0.4)" }}>
            {caption}
          </p>
        </div>
        
      </div>
    </section>
  );
}
