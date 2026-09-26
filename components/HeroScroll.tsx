"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface HeroScrollProps {
  title: string;
  subtitle: string;
  browseVehicles: string;
  contactUs: string;
}

const FRAME_COUNT = 74;

export default function HeroScroll({
  title,
  browseVehicles,
}: HeroScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textMaskRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ctaBtnRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(6, "0");
      img.src = `/images/frames/frame_${paddedIndex}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      };
      images.push(img);
    }
  }, []);

  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId: number;
    let currentFrameIndex = -1;
    let cssWidth = 0;
    let cssHeight = 0;
    let lastScrollTop = 0;

    const renderFrame = (frameIndex: number) => {
      if (frameIndex === currentFrameIndex) return;
      currentFrameIndex = frameIndex;

      if (imagesRef.current[frameIndex]) {
        const img = imagesRef.current[frameIndex];
        const scale = Math.max(cssWidth / img.width, cssHeight / img.height);
        const x = (cssWidth / 2) - (img.width / 2) * scale;
        const y = (cssHeight / 2) - (img.height / 2) * scale;
        context.clearRect(0, 0, cssWidth, cssHeight);
        context.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Sync text glass mask with current frame
        if (textMaskRef.current) {
          textMaskRef.current.style.backgroundImage = `url(${img.src})`;
        }
      }
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const cappedDpr = Math.min(dpr, 1.5);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = cssWidth * cappedDpr;
      canvas.height = cssHeight * cappedDpr;
      context.scale(cappedDpr, cappedDpr);
      currentFrameIndex = -1;
      if (containerRef.current) {
        lastScrollTop = -containerRef.current.getBoundingClientRect().top;
      }
      handleScroll();
    };

    const handleScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentScrollTop = -rect.top;
        const isScrollingDown = currentScrollTop > lastScrollTop;
        lastScrollTop = currentScrollTop;
        const scrollDistance = currentScrollTop;
        const scrollableHeight = rect.height - window.innerHeight;
        let progress = scrollDistance / scrollableHeight;
        progress = Math.max(0, Math.min(1, progress));
        const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
        renderFrame(frameIndex);

        if (textContainerRef.current) {
          textContainerRef.current.style.transform = `translateY(${progress * 60}px)`;
        }

        if (headingRef.current) {
          const scaleValue = 1 + (progress * 0.20); // Scale up to 1.20
          headingRef.current.style.transform = `scale(${scaleValue})`;
        }

        if (ctaBtnRef.current) {
          if (frameIndex >= 48) {
            ctaBtnRef.current.style.opacity = "1";
            ctaBtnRef.current.style.transform = "translate(-50%, -50%) scale(1)";
            ctaBtnRef.current.style.pointerEvents = "auto";
          } else {
            ctaBtnRef.current.style.opacity = "0";
            ctaBtnRef.current.style.transform = "translate(-50%, -50%) scale(0.9)";
            ctaBtnRef.current.style.pointerEvents = "none";
          }
        }

        window.dispatchEvent(new CustomEvent("hero-frame", { detail: { frameIndex, isScrollingDown } }));
      });
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", handleScroll, { passive: true });
    resizeCanvas();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [imagesLoaded]);

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: "400vh", background: "var(--mm-navy)" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ backgroundColor: "#0A0E14" }}>

        {/* Radial blue glow — centered in lower half where car sits */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)",
          }}
        />

        {/* Canvas for frame sequence */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ willChange: "transform", zIndex: 1 }}
        />

        {/* Strong vignette — darkens screen edges so car pops */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.95) 100%)",
            zIndex: 2,
          }}
        />

        {/* Loading state */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 z-30 ${
            imagesLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ backgroundColor: "#0A0E14" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2"
              style={{ borderColor: "rgba(45,127,249,0.15)", borderTopColor: "#2D7FF9" }}
            />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              {t("loading")}
            </span>
          </div>
        </div>

        {/* Hero copy — top band, short title only, never over the car */}
        {/* Hero copy — top band, short title only, never over the car */}
        <div
          ref={textContainerRef}
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-20"
          style={{ top: "12vh", paddingLeft: "1.5rem", paddingRight: "1.5rem", willChange: "transform" }}
        >
          <span className="mm-label mb-4">Manhattan Motors</span>
          <h1
            ref={headingRef}
            className="text-center font-black tracking-tight leading-none relative"
            style={{
              fontSize: "clamp(1.9rem, 5vw, 3.8rem)",
              letterSpacing: "-0.02em",
              transformOrigin: "top center",
              willChange: "transform"
            }}
          >
            {/* Blurred image mask (the "frosted glass") */}
            <span
              ref={textMaskRef}
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/images/frames/frame_000000.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "blur(4px) brightness(1.2)",
                zIndex: 1,
              }}
            >
              {tHero("heading")}
            </span>
            {/* Stroke/silhouette for readability */}
            <span
              className="relative"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.4)",
                textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                zIndex: 2,
              }}
            >
              {tHero("heading")}
            </span>
          </h1>
        </div>

        {/* CTA Button — centered, fades in at frame 48 */}
        <div 
          ref={ctaBtnRef}
          className="absolute left-1/2 top-[45%] z-30"
          style={{ 
            transform: "translate(-50%, -50%) scale(0.9)", 
            opacity: 0, 
            pointerEvents: "none",
            transition: "opacity 300ms ease, transform 300ms ease" 
          }}
        >
          <Link
            href="/vehicles"
            className="hero-btn inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              padding: "0.65rem 1.75rem",
              borderRadius: "6px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}
          >
            {browseVehicles}
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>

        {/* Bottom gradient — blends canvas into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "18vh",
            background: "linear-gradient(to bottom, transparent, var(--mm-navy))",
            zIndex: 3,
          }}
        />
      </div>
    </section>
  );
}