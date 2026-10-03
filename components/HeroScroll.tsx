"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface HeroScrollProps {
  title: string;
  subtitle: string;
  browseVehicles: string;
  contactUs: string;
}

const FRAME_COUNT = 101; // frame_000000.jpg ... frame_000100.jpg

export default function HeroScroll({ title, subtitle, browseVehicles }: HeroScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const [framesLoaded, setFramesLoaded] = useState(false);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");

  // ── Preload all frame images once ─────────────────────────────────────────
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(6, "0");
      img.src = `/images/frames/frame_${paddedIndex}.jpg`;

      const onDone = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setFramesLoaded(true);
        }
      };

      img.onload = onDone;
      img.onerror = onDone; // don't block forever if one frame fails
      images.push(img);
    }

    imagesRef.current = images;
  }, []);

  // ── Set hero scroll height ────────────────────────────────────────────────
  useEffect(() => {
    const applyHeight = () => {
      if (!containerRef.current) return;
      containerRef.current.style.height = window.innerWidth < 768 ? "300vh" : "400vh";
    };
    applyHeight();
    window.addEventListener("resize", applyHeight, { passive: true });
    return () => window.removeEventListener("resize", applyHeight);
  }, []);

  // ── Canvas sizing (device-pixel-ratio aware, crisp on mobile) ────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Scroll-driven frame rendering (cheap canvas draw, zero video seeking) ─
  useEffect(() => {
    if (!framesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let lastDrawnFrame = -1;
    let isLoopRunning = false;

    const drawFrame = (progress: number) => {
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(progress * (FRAME_COUNT - 1))));
      if (frameIndex === lastDrawnFrame) return;
      lastDrawnFrame = frameIndex;

      const img = imagesRef.current[frameIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvasWidth / canvasHeight;
      const isMobile = canvasWidth < 768;

      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

      if (imgRatio > canvasRatio) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgRatio;
        const bias = isMobile ? 0.3 : 0.5;
        offsetX = -(drawWidth - canvasWidth) * bias;
        offsetY = 0;
      } else {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imgRatio;
        offsetX = 0;
        offsetY = -(drawHeight - canvasHeight) * 0.5;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      if (textContainerRef.current) {
        const fadeOpacity = progress <= 0.15 ? 1 : Math.max(0, 1 - (progress - 0.15) / 0.2);
        textContainerRef.current.style.opacity = fadeOpacity.toString();
      }
    };

    const animationLoop = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.001) {
        currentProgress = targetProgress;
        drawFrame(currentProgress);
        isLoopRunning = false;
        return;
      }
      currentProgress += diff * 0.25;
      drawFrame(currentProgress);
      rafId = requestAnimationFrame(animationLoop);
    };

    const startLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animationLoop);
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || !stickyRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const stickyRect = stickyRef.current.getBoundingClientRect();
      const scrollableHeight = rect.height - stickyRect.height;
      const progress = scrollableHeight > 0 ? -rect.top / scrollableHeight : 0;
      targetProgress = Math.max(0, Math.min(1, progress));
      startLoop();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [framesLoaded]);

  return (
    <section ref={containerRef} className="relative w-full" style={{ height: "400vh", background: "var(--mm-navy)" }}>
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden" style={{ backgroundColor: "#0A0E14" }}>
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)" }}
        />

        <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 1 }} />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.95) 100%)", zIndex: 2 }}
        />

        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 z-30 ${framesLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          style={{ backgroundColor: "#0A0E14" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: "rgba(45,127,249,0.15)", borderTopColor: "#2D7FF9" }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              {t("loading")}
            </span>
          </div>
        </div>

        <div
          ref={textContainerRef}
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-20"
          style={{ top: "clamp(100px, 15vh, 200px)", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
        >
          <h1 className="font-heading text-center font-normal leading-none text-[clamp(2rem,5vw,4rem)] text-[#F5F5F0]" style={{ letterSpacing: "-0.02em" }}>
            {tHero("heading")}
          </h1>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: "18vh", background: "linear-gradient(to bottom, transparent, var(--mm-navy))", zIndex: 3 }}
        />
      </div>
    </section>
  );
}