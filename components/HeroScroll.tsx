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

export default function HeroScroll({
  title,
  subtitle,
  browseVehicles,
}: HeroScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const secondHeadingRef = useRef<HTMLHeadingElement>(null);
  
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
  // ── iOS Video Wake & Full Buffering Preload ────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let timeoutId: NodeJS.Timeout;

    const finalizeReady = () => {
      setVideoLoaded(true);
      clearTimeout(timeoutId);
    };

    // Timeout as fallback, don't wait 5s normally
    timeoutId = setTimeout(() => {
      console.warn("Hero video preload timed out, forcing ready state");
      finalizeReady();
    }, 5000);

    const handleCanPlay = () => {
      finalizeReady();
    };

    video.addEventListener('canplay', handleCanPlay);

    // Also wake on loadedmetadata if needed for iOS
    video.addEventListener('loadedmetadata', () => {
      video.muted = true;
      video.defaultMuted = true;
      video.play().then(() => video.pause()).catch(() => {});
    }, { once: true });

    if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
      finalizeReady();
    }

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);
  // ── Set hero scroll height directly on the DOM element ───────────────────
  useEffect(() => {
    const applyHeight = () => {
      if (!containerRef.current) return;
      // 300vh gives enough scroll distance to smoothly scrub through video
      containerRef.current.style.height = window.innerWidth < 768 ? "300vh" : "400vh";
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
    let lastVideoFrame = -1;
    let isSeeking = false;
    let isLoopRunning = false;

    const renderFrame = (progress: number) => {
      // Use video.duration dynamically to adapt to any video length (assuming ~30fps for simulated deduplication)
      const currentDuration = video.duration || 1;
      const dynamicFrameCount = Math.max(1, Math.floor(currentDuration * 30));
      
      // We calculate a simulated frameIndex so UI elements (fade, etc) still sync perfectly
      const frameIndex = Math.min(dynamicFrameCount - 1, Math.floor(progress * dynamicFrameCount));

      // Scrub video with frame deduplication and backpressure
      if (video.readyState >= 1) {
        if (frameIndex !== lastVideoFrame) {
          const v = video as any;
          if ('requestVideoFrameCallback' in v) {
            if (!isSeeking) {
              isSeeking = true;
              lastVideoFrame = frameIndex;
              v.currentTime = progress * v.duration;
              v.requestVideoFrameCallback(() => {
                isSeeking = false;
              });
            }
          } else {
            // Fallback for older Safari: just de-duplicate by frame index
            lastVideoFrame = frameIndex;
            v.currentTime = progress * v.duration;
          }
        }
      }

      if (frameIndex !== lastRenderedFrame) {
        lastRenderedFrame = frameIndex;
        window.dispatchEvent(new CustomEvent("hero-frame", { detail: { frameIndex, isScrollingDown: targetProgress > currentProgress } }));
      }

      /* DIAGNOSTIC TEST: Text animations completely disabled
      if (textContainerRef.current) {
        textContainerRef.current.style.transform = `translateY(${progress * 60}px)`;
      }

      if (headingRef.current) {
        const words = headingRef.current.querySelectorAll("span");
        const fadeWindow = 0.25;
        const staggerAmount = 0.05;
        
        words.forEach((word, index) => {
          const wordStart = 0.08 + (index * staggerAmount);
          const wordProgress = Math.max(0, Math.min(1, (progress - wordStart) / fadeWindow));
          
          const opacity = 1 - wordProgress;
          const scale = 1 + (wordProgress * 0.3);
          // blur disabled for testing
          
          const el = word as HTMLElement;
          el.style.opacity = opacity.toString();
          // el.style.filter = `blur(${blur}px)`;
          el.style.transform = `scale(${scale})`;
        });
      }

      if (secondHeadingRef.current) {
        const words = secondHeadingRef.current.querySelectorAll("span");
        const fadeWindow = 0.25;
        const staggerAmount = 0.05;
        
        words.forEach((word, index) => {
          const baseStart = 0.50;
          const wordStart = baseStart + (index * staggerAmount);
          const wordProgress = Math.max(0, Math.min(1, (progress - wordStart) / fadeWindow));
          
          const opacity = wordProgress;
          const scale = 1.3 - (wordProgress * 0.3);
          // blur disabled for testing
          
          const el = word as HTMLElement;
          el.style.opacity = opacity.toString();
          // el.style.filter = `blur(${blur}px)`;
          el.style.transform = `scale(${scale})`;
        });
      }
      */

      if (videoRef.current) {
        const videoFadeOpacity = progress <= 0.90 ? 1 : Math.max(0, 1 - ((progress - 0.90) / 0.10));
        videoRef.current.style.opacity = videoFadeOpacity.toString();
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

      currentProgress += diff * 0.25;
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
      if (!containerRef.current || !stickyRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const stickyRect = stickyRef.current.getBoundingClientRect();
      const currentScrollTop = -rect.top;
      
      // Use the actual rendered height of the sticky element, not window.innerHeight.
      // On iOS Safari, 100vh (sticky element height) and window.innerHeight can disagree 
      // due to the URL bar, causing the physical unpin point to mismatch the progress math.
      const scrollableHeight = rect.height - stickyRect.height;
      
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
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden" style={{ backgroundColor: "#0A0E14" }}>

        {/* Radial blue glow — centered in lower half where car sits */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)",
          }}
        />

        <video
          ref={videoRef}
          src="/videos/heronew-optimized.mp4"
          poster="/images/frames/frame_000000.jpg"
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
          <div className="relative w-full flex justify-center h-[200px]">
            <h1
              ref={headingRef}
              className="font-heading text-center font-normal leading-none absolute top-0 text-[clamp(2rem,5vw,4rem)] text-[#F5F5F0]"
              style={{
                letterSpacing: "-0.02em",
                transformOrigin: "top center",
              }}
            >
              {tHero("heading").split(" ").map((word, i) => (
                <span key={i} className="inline-block mx-[0.12em]" style={{ transformOrigin: "center center", willChange: "transform, opacity" }}>
                  {word}
                </span>
              ))}
            </h1>

            {/* SECOND HEADING (Hidden for diagnostic test) */}
            <h2
              ref={secondHeadingRef}
              className="hidden font-heading text-center font-normal leading-tight absolute top-0 flex flex-col text-[clamp(2rem,5vw,4rem)] text-[#F5F5F0]"
              style={{
                letterSpacing: "-0.02em",
                transformOrigin: "top center",
              }}
            >
              <div className="flex justify-center flex-wrap">
                {tHero("secondHeadingLine1").split(" ").map((word, i) => (
                  <span key={i} className="inline-block mx-[0.12em] opacity-0" style={{ transformOrigin: "center center", willChange: "transform, opacity" }}>
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex justify-center flex-wrap">
                {tHero("secondHeadingLine2").split(" ").map((word, i) => (
                  <span key={`l2-${i}`} className="inline-block mx-[0.12em] opacity-0" style={{ transformOrigin: "center center", willChange: "transform, opacity" }}>
                    {word}
                  </span>
                ))}
              </div>
            </h2>
          </div>
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