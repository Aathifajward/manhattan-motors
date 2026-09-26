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
  const videoRef = useRef<HTMLVideoElement>(null);
  const textMaskRef = useRef<HTMLSpanElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ctaBtnRef = useRef<HTMLDivElement>(null);
  
  const [videoLoaded, setVideoLoaded] = useState(false);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");

  // ── Preload + decode all frames (COMMENTED OUT FOR VIDEO FALLBACK) ────────
  /*
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(6, "0");
      img.src = `/images/frames/frame_${paddedIndex}.jpg`;
      
      img.decode().then(() => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      }).catch((e) => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images;
          setImagesLoaded(true);
        }
      });
      images.push(img);
    }
  }, []);
  */
  // ── Safety timeout: never block the page forever if video fails/hangs ────
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ── iOS Video Wake Sequence ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const wakeVideo = async () => {
      try {
        video.muted = true; // must be set before play() on iOS
        video.defaultMuted = true;
        await video.play();
        video.pause();
        video.currentTime = 0;
        setVideoLoaded(true);
      } catch (err) {
        console.error('iOS video wake failed:', err);
        setVideoLoaded(true); // still proceed so page isn't stuck
      }
    };

    if (video.readyState >= 1) {
      wakeVideo();
    } else {
      video.addEventListener('loadedmetadata', wakeVideo, { once: true });
    }
  }, []);


  // ── Set hero scroll height directly on the DOM element ───────────────────
  useEffect(() => {
    const applyHeight = () => {
      if (!containerRef.current) return;
      // 250vh gives enough scroll distance to smoothly scrub through video
      containerRef.current.style.height = window.innerWidth < 768 ? "250vh" : "400vh";
    };
    applyHeight();
    window.addEventListener("resize", applyHeight, { passive: true });
    return () => window.removeEventListener("resize", applyHeight);
  }, []);

  useEffect(() => {
    if (!videoLoaded || !videoRef.current || !containerRef.current) return;
    const video = videoRef.current;

    let rafId = 0;
    
    // Lerp state
    let targetProgress = 0;
    let currentProgress = 0;
    let lastRenderedFrame = -1;
    let isLoopRunning = false;

    const renderFrame = (progress: number) => {
      // We calculate a simulated frameIndex so UI elements (fade, etc) still sync perfectly
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));

      // Scrub video to exact time
      if (video.readyState >= 1) {
        video.currentTime = progress * video.duration;
      }

      if (frameIndex !== lastRenderedFrame) {
        lastRenderedFrame = frameIndex;
        window.dispatchEvent(new CustomEvent("hero-frame", { detail: { frameIndex, isScrollingDown: targetProgress > currentProgress } }));
      }

      if (textContainerRef.current) {
        textContainerRef.current.style.transform = `translateY(${progress * 60}px)`;
      }

      if (headingRef.current) {
        const scaleValue = 1 + (progress * 0.20);
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
    };

    const animationLoop = () => {
      const diff = targetProgress - currentProgress;
      
      if (Math.abs(diff) < 0.001) {
        currentProgress = targetProgress;
        renderFrame(currentProgress);
        isLoopRunning = false;
        return;
      }

      currentProgress += diff * 0.15;
      renderFrame(currentProgress);
      rafId = requestAnimationFrame(animationLoop);
    };

    const startAnimationLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animationLoop);
      }
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentScrollTop = -rect.top;
      const scrollableHeight = rect.height - window.innerHeight;
      
      let progress = 0;
      if (scrollableHeight > 0) {
        progress = currentScrollTop / scrollableHeight;
      }
      
      targetProgress = Math.max(0, Math.min(1, progress));
      startAnimationLoop();
    };

    const handleResize = () => {
      handleScroll(); // just trigger recalculation
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    
    // Initial sync
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [videoLoaded]);

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

        <video
          ref={videoRef}
          src="/videos/hero.mp4"
          muted
          playsInline
          // @ts-ignore: React sometimes complains about webkit-playsinline but it's required for older iOS
          webkit-playsinline="true"
          preload="auto"
          onError={() => setVideoLoaded(true)} // Always resolve if it 404s/fails
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            zIndex: 1, 
            willChange: "transform",
            // objectPosition: "30% center" keeps the front of the car in view on mobile 
            // exactly like the old 0.3 crop bias did!
            objectPosition: typeof window !== "undefined" && window.innerWidth < 768 ? "30% center" : "center" 
          }}
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
            videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
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
        <div
          ref={textContainerRef}
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none z-20"
          style={{ top: "clamp(100px, 15vh, 200px)", paddingLeft: "1.5rem", paddingRight: "1.5rem", willChange: "transform" }}
        >
          <span className="mm-label mb-4">Manhattan Motors</span>
          <h1
            ref={headingRef}
            className="text-center font-black tracking-tight leading-none relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
            style={{
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
                // (FALLBACK) backgroundImage: "url(/images/frames/frame_000000.jpg)",
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
          className="absolute left-1/2 top-[60%] sm:top-[55%] md:top-[45%] z-30"
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