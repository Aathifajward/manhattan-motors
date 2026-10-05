"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface HeroScrollProps {
  title: string;
  subtitle: string;
  browseVehicles: string;
  contactUs: string;
}

const VIDEO_SRC = "/videos/heronew-scrub.mp4";
const POSTER_SRC = "/images/frames/frame_000000.webp";
const FPS = 30;
const MIN_STEP = 0.5 / FPS; // only seek when the target moved at least half a frame
const SEEK_INTERVAL_MS = 1000 / 30; // throttle seek writes to ~30/s
const SEEK_WATCHDOG_MS = 150; // never let a lost "seeked" event freeze scrubbing
const LERP = 0.2;

type SeekableVideo = HTMLVideoElement & { fastSeek?: (time: number) => void };

export default function HeroScroll({ title, subtitle, browseVehicles }: HeroScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLPreElement>(null);

  const [ready, setReady] = useState(false);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");

  useEffect(() => {
    const video = videoRef.current as SeekableVideo | null;
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!video || !container || !sticky) return;

    const poster = posterRef.current;
    const textEl = textRef.current;
    const debugEl = debugRef.current;
    const debugOn = new URLSearchParams(window.location.search).has("heroDebug");
    if (debugEl && debugOn) debugEl.style.display = "block";

    // Page must never reopen halfway through the hero.
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    video.muted = true;
    video.defaultMuted = true;

    let disposed = false;
    let objectUrl: string | null = null;
    let triedFallback = false;
    let primed = false;
    let inView = true;
    let rafId = 0;

    let progress = 0;
    let duration = 0;
    let targetTime = 0;
    let easedTime = 0;
    let lastWrittenTime = 0;
    let lastSeekAt = 0;
    let seekStartedAt = 0;
    let seekInFlight = false;
    let pendingSeekTime: number | null = null;
    let frameShown = false;
    let lastDebugAt = 0;

    const markReady = () => {
      if (!disposed) setReady(true);
    };

    const resetToStart = () => {
      easedTime = 0;
      lastWrittenTime = 0;
      pendingSeekTime = null;
      try {
        video.currentTime = 0;
      } catch {
        /* metadata not available yet */
      }
    };

    const computeProgress = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const p = scrollable > 0 ? -rect.top / scrollable : 0;
      return Math.min(1, Math.max(0, p));
    };

    const writeSeek = (time: number, now: number) => {
      seekInFlight = true;
      seekStartedAt = now;
      lastSeekAt = now;
      lastWrittenTime = time;
      try {
        const jump = Math.abs(time - video.currentTime);
        if (typeof video.fastSeek === "function" && jump > 0.5) {
          video.fastSeek(time);
        } else {
          video.currentTime = time;
        }
      } catch {
        seekInFlight = false;
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (disposed) return;

      progress = computeProgress();
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      targetTime = duration > 0 ? progress * Math.max(0, duration - 0.02) : 0;

      // Ease toward the target.
      easedTime += (targetTime - easedTime) * LERP;
      if (Math.abs(targetTime - easedTime) < 0.002) easedTime = targetTime;

      // Watchdog: if a "seeked" event never arrives, do not stay blocked forever.
      if (seekInFlight && now - seekStartedAt > SEEK_WATCHDOG_MS) seekInFlight = false;

      // Newest target always wins.
      if (
        duration > 0 &&
        video.readyState >= 1 &&
        Math.abs(easedTime - lastWrittenTime) >= MIN_STEP
      ) {
        pendingSeekTime = easedTime;
      }
      if (pendingSeekTime !== null && !seekInFlight && now - lastSeekAt >= SEEK_INTERVAL_MS) {
        const next: number = pendingSeekTime;
        pendingSeekTime = null;
        writeSeek(next, now);
      }

      // Poster stays until a seek has really completed (so the hero is never blank).
      const showPoster = !(frameShown && progress > 0.002);
      if (poster) poster.style.opacity = showPoster ? "1" : "0";

      // Soft fade out over the last 10% so it blends into the next section.
      video.style.opacity =
        progress <= 0.9 ? "1" : String(Math.max(0, 1 - (progress - 0.9) / 0.1));
      if (textEl) {
        textEl.style.opacity = String(
          progress <= 0.15 ? 1 : Math.max(0, 1 - (progress - 0.15) / 0.2)
        );
      }

      if (debugOn && debugEl && now - lastDebugAt > 100) {
        lastDebugAt = now;
        debugEl.textContent = [
          `src: ${video.currentSrc.startsWith("blob:") ? "blob" : video.currentSrc ? "url" : "none"}`,
          `readyState: ${video.readyState}  network: ${video.networkState}`,
          `error: ${video.error ? video.error.code : "-"}`,
          `size: ${video.videoWidth}x${video.videoHeight}  dur: ${duration.toFixed(2)}`,
          `progress: ${progress.toFixed(3)}`,
          `target: ${targetTime.toFixed(3)}  eased: ${easedTime.toFixed(3)}`,
          `currentTime: ${video.currentTime.toFixed(3)}`,
          `inFlight: ${seekInFlight}  frameShown: ${frameShown}  primed: ${primed}`,
        ].join("\n");
      }

      if (inView) rafId = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };

    // iOS/Android may not decode frames for a never-played video until it has been "woken".
    const prime = () => {
      if (primed || disposed) return;
      primed = true;
      video.muted = true;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          video.pause();
          resetToStart();
        }).catch(() => {
          primed = false; // retry on the first touch
        });
      }
    };

    const onLoadedMetadata = () => {
      duration = Number.isFinite(video.duration) ? video.duration : 0;
      resetToStart();
      kick();
    };
    const onLoadedData = () => {
      markReady();
      prime();
      kick();
    };
    const onCanPlay = () => markReady();
    const onSeeked = () => {
      seekInFlight = false;
      frameShown = true;
      kick();
    };
    const onError = () => {
      if (objectUrl && !triedFallback) {
        triedFallback = true;
        video.src = VIDEO_SRC;
        video.load();
        return;
      }
      markReady();
    };
    const onPageShow = () => {
      resetToStart();
      kick();
    };
    const onDomReady = () => resetToStart();
    const onScrollOrResize = () => kick();

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("DOMContentLoaded", onDomReady);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("touchstart", prime, { once: true, passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView) kick();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(container);

    // Load the whole file into memory first: seeking is then local and instant,
    // with no range requests (the file is only a few MB).
    const load = async () => {
      try {
        const res = await fetch(VIDEO_SRC);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        video.src = objectUrl;
      } catch {
        if (disposed) return;
        video.src = VIDEO_SRC;
      }
      video.load();
    };
    void load();

    resetToStart();
    kick();
    const fallbackTimer = window.setTimeout(markReady, 6000);

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("DOMContentLoaded", onDomReady);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("touchstart", prime);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      history.scrollRestoration = prevRestoration;
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[300vh] md:h-[400vh]"
      style={{ background: "var(--mm-navy)" }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        style={{ backgroundColor: "#0A0E14" }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)",
          }}
        />

        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          className="absolute inset-0 w-full h-full object-cover object-[30%_center] md:object-center"
          style={{ zIndex: 1 }}
        />

        {/* Start-frame poster: stays until a seek has really painted a frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={posterRef}
          src={POSTER_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[30%_center] md:object-center pointer-events-none"
          style={{ zIndex: 2, transition: "opacity 300ms ease" }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.95) 100%)",
            zIndex: 3,
          }}
        />

        <div
          ref={textRef}
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none"
          style={{
            top: "clamp(100px, 15vh, 200px)",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            zIndex: 20,
          }}
        >
          <h1
            className="font-heading text-center font-normal leading-none text-[clamp(2rem,5vw,4rem)] text-[#F5F5F0]"
            style={{ letterSpacing: "-0.02em" }}
          >
            {tHero("heading")}
          </h1>
        </div>

        {/* Small loader over the poster; hides once the video is ready */}
        <div
          className={`absolute inset-x-0 bottom-[14vh] flex flex-col items-center gap-3 pointer-events-none transition-opacity duration-500 ${
            ready ? "opacity-0" : "opacity-100"
          }`}
          style={{ zIndex: 30 }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{ borderColor: "rgba(45,127,249,0.15)", borderTopColor: "#2D7FF9" }}
          />
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {t("loading")}
          </span>
        </div>

        {/* Bottom gradient: blends the last frame into the next section */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "18vh",
            background: "linear-gradient(to bottom, transparent, var(--mm-navy))",
            zIndex: 4,
          }}
        />

        {/* Debug overlay: add ?heroDebug to the URL */}
        <pre
          ref={debugRef}
          className="absolute left-2 top-24 pointer-events-none whitespace-pre-wrap rounded bg-black/75 p-2 text-[10px] leading-tight text-lime-300"
          style={{ display: "none", zIndex: 50 }}
        />
      </div>
    </section>
  );
}