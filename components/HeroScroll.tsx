"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface HeroScrollProps {
  title: string;
  subtitle: string;
  browseVehicles: string;
  contactUs: string;
}

export default function HeroScroll({ title, subtitle, browseVehicles }: HeroScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");
  
  const objectUrlRef = useRef<string | null>(null);
  const primedRef = useRef(false);
  const firstFramePaintedRef = useRef(false);
  const blobLoadedRef = useRef(false);
  const retryPrimeAttachedRef = useRef(false);

  useEffect(() => {
    // Force scroll restoration manual so we don't start halfway down on reload
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const applyHeight = () => {
      if (!containerRef.current) return;
      containerRef.current.style.height = window.innerWidth < 768 ? "300vh" : "400vh";
    };
    applyHeight();
    window.addEventListener("resize", applyHeight, { passive: true });
    return () => window.removeEventListener("resize", applyHeight);
  }, []);

  // Loading state with 5 second fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    const videoSrc = "/videos/heronew-scrub.mp4";

    const attemptPrime = async () => {
      if (!video || primedRef.current) return;
      try {
        video.muted = true;
        await video.play();
        video.pause();
        video.currentTime = 0;
        primedRef.current = true;
      } catch (err) {
        if (!retryPrimeAttachedRef.current) {
          retryPrimeAttachedRef.current = true;
          const retry = () => {
            attemptPrime();
            window.removeEventListener("touchstart", retry);
            window.removeEventListener("scroll", retry);
          };
          window.addEventListener("touchstart", retry, { once: true, passive: true });
          window.addEventListener("scroll", retry, { once: true, passive: true });
        }
      }
    };

    const checkLoaded = () => {
      if (blobLoadedRef.current && video.readyState >= 2) {
        setVideoLoaded(true);
        attemptPrime();
      }
    };

    const onLoadedData = () => {
      checkLoaded();
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onLoadedData); // ensure it doesn't block forever

    fetch(videoSrc)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (!isMounted) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        video.src = objectUrl;
        blobLoadedRef.current = true;
        checkLoaded();
      })
      .catch((err) => {
        if (!isMounted) return;
        video.src = videoSrc;
        blobLoadedRef.current = true;
        checkLoaded();
      });

    const resetTime = () => {
      if (video) video.currentTime = 0;
    };
    
    resetTime();
    window.addEventListener("DOMContentLoaded", resetTime);
    window.addEventListener("pageshow", resetTime);

    return () => {
      isMounted = false;
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onLoadedData);
      window.removeEventListener("DOMContentLoaded", resetTime);
      window.removeEventListener("pageshow", resetTime);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Scroll scrubbing logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !containerRef.current || !stickyRef.current) return;

    let rafId = 0;
    let targetTime = 0;
    let easedTime = 0;
    let lastWrittenTime = -1;
    let seekInFlight = false;
    let lastWriteStamp = 0;
    let posterFaded = false;

    const hidePoster = () => {
      if (!posterFaded && posterRef.current) {
        posterRef.current.style.opacity = "0";
        posterFaded = true;
      }
    };

    const onFirstFrame = () => {
      firstFramePaintedRef.current = true;
      if (targetTime > 0) {
        hidePoster();
      }
    };

    const onSeeked = () => {
      seekInFlight = false;
      if (!firstFramePaintedRef.current) {
        if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
          (video as any).requestVideoFrameCallback(() => {
            onFirstFrame();
          });
        } else {
          onFirstFrame();
        }
      }
    };
    video.addEventListener("seeked", onSeeked);

    const animationLoop = (time: number) => {
      easedTime += (targetTime - easedTime) * 0.2; // Damping
      
      // Throttle seek writes to ~30fps (33ms)
      if (time - lastWriteStamp > 33 && !seekInFlight) {
        // Only write if change is > half a frame (at 30fps, 1/60 = 0.016s)
        if (Math.abs(easedTime - lastWrittenTime) > 0.016 && video.duration) {
          seekInFlight = true;
          lastWrittenTime = easedTime;
          lastWriteStamp = time;
          
          if (typeof (video as any).fastSeek === "function") {
            try {
              (video as any).fastSeek(easedTime);
            } catch (e) {
              video.currentTime = easedTime;
            }
          } else {
            video.currentTime = easedTime;
          }
        }
      }
      
      // Video fade near the end (last 10% of scroll)
      const duration = video.duration || 1;
      const progress = easedTime / duration;
      
      // Force video opacity to 1 before 90% scroll
      if (progress > 0.9) {
        video.style.opacity = Math.max(0, 1 - (progress - 0.9) * 10).toString();
      } else {
        video.style.opacity = "1";
      }

      rafId = requestAnimationFrame(animationLoop);
    };
    rafId = requestAnimationFrame(animationLoop);

    const handleScroll = () => {
      if (!containerRef.current || !stickyRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const stickyRect = stickyRef.current.getBoundingClientRect();
      const scrollableHeight = rect.height - stickyRect.height;
      const progress = scrollableHeight > 0 ? -rect.top / scrollableHeight : 0;
      const p = Math.max(0, Math.min(1, progress));
      
      if (video.duration) {
        targetTime = p * video.duration;
      }

      if (p > 0 && firstFramePaintedRef.current) {
        hidePoster();
      }

      if (textContainerRef.current) {
        const fadeOpacity = p <= 0.15 ? 1 : Math.max(0, 1 - (p - 0.15) / 0.2);
        textContainerRef.current.style.opacity = fadeOpacity.toString();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      video.removeEventListener("seeked", onSeeked);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative w-full" style={{ height: "400vh", background: "var(--mm-navy)" }}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden" style={{ backgroundColor: "#0A0E14" }}>
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)" }}
        />

        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            poster="/images/frames/frame_000000.webp"
            className="absolute inset-0 w-full h-full object-cover [object-position:30%_center] md:[object-position:center]"
            style={{ opacity: 1 }}
          />
          {/* Start Frame Poster (fades out on scroll) */}
          <img
            ref={posterRef}
            src="/images/frames/frame_000000.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover [object-position:30%_center] md:[object-position:center] transition-opacity duration-500 pointer-events-none"
          />
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.95) 100%)", zIndex: 2 }}
        />

        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 z-30 ${videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
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