"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { easeInOut } from "./scroll/stacked";

interface HeroScrollProps {
  title: string;
  subtitle: string;
  browseVehicles: string;
  contactUs: string;
}

const VIDEO_SRC = "/videos/heronew-scrub.mp4";
const FPS = 30;
const MIN_STEP = 0.5 / FPS; // only seek when the target moved at least half a frame
const SEEK_INTERVAL_MS = 1000 / 30; // throttle seek writes to ~30/s
const SEEK_WATCHDOG_MS = 150; // never let a lost "seeked" event freeze scrubbing
const LERP = 0.2;

/* ── The hero line's exit ──────────────────────────────────────────────────
   It pulls toward the viewer while the words burn off one after another,
   left to right, and is gone well before the statement rectangle starts to
   open over the video — the last tenth of the scrub is the bare film.
   Transform and colour only — the words are inline-block spans, so nothing
   they do moves anything else.                                           */

const EXIT_FROM = 0.22;
const EXIT_TO = 0.45;
/** How much of that range one word owns; the remainder is the stagger. */
const WORD_SPAN = 0.45;
/** Where inside a word's own exit it reaches full blue, and where it starts
 *  to go. The gap between them is the flash. */
const FLASH_AT = 0.35;
const FADE_FROM = 0.45;

/** The line as a whole, pulling toward the viewer. */
const HERO_SCALE_TO = 1.35;
/** And each word collapsing away under that, against it. */
const WORD_SCALE_TO = 0.7;

const HERO_INK: [number, number, number] = [245, 245, 240]; // #F5F5F0
const HERO_BLUE: [number, number, number] = [47, 139, 255]; // #2F8BFF
const HERO_GLOW = "0 0 18px rgba(47,139,255,0.55)";
const HERO_INK_CSS = `rgb(${HERO_INK[0]}, ${HERO_INK[1]}, ${HERO_INK[2]})`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ink to blue, reached a third of the way through the word's exit and held
 *  from there, so the flash is what you see just before it goes. */
function wordColor(w: number) {
  const hot = clamp01(w / FLASH_AT);
  const ch = (i: number) => mix(HERO_INK[i], HERO_BLUE[i], hot);
  return `rgb(${ch(0) | 0}, ${ch(1) | 0}, ${ch(2) | 0})`;
}

/**
 * Words with their spaces kept as their own units, so the line sets exactly
 * as it does now. A script that does not use spaces falls back to one unit
 * per character, which is the same cadence. `slot` is the unit's place in the
 * sweep, -1 for the spaces, which never take a turn.
 */
function splitWords(text: string) {
  const parts = text.split(/(\s+)/).filter(Boolean);
  const units =
    parts.filter((x) => !/^\s+$/.test(x)).length > 1 ? parts : Array.from(text);
  let slot = 0;
  return units.map((chars) => ({ chars, slot: /^\s+$/.test(chars) ? -1 : slot++ }));
}

type SeekableVideo = HTMLVideoElement & { fastSeek?: (time: number) => void };

export default function HeroScroll({ title, subtitle, browseVehicles }: HeroScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  // Hero refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugRef = useRef<HTMLPreElement>(null);

  /** The hero line, and one span per word of it. */
  const heroLineRef = useRef<HTMLHeadingElement>(null);
  const heroWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastWordStyle = useRef<string[]>([]);

  // Statement refs
  const statementImageRef = useRef<HTMLDivElement>(null);
  const statementContentRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const t = useTranslations("HomePage");
  const tHero = useTranslations("hero");
  const tStatement = useTranslations("Statement");

  const heroWords = useMemo(() => splitWords(tHero("heading")), [tHero]);
  const heroWordCount = heroWords.reduce((n, u) => (u.slot >= 0 ? n + 1 : n), 0);

  useEffect(() => {
    const video = videoRef.current as SeekableVideo | null;
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!video || !container || !sticky) return;

    const debugEl = debugRef.current;
    const heroLine = heroLineRef.current;

    const sImageEl = statementImageRef.current;
    const sContentEl = statementContentRef.current;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      
      // Video scrubbing range (0.00 to 0.55)
      const scrubProgress = Math.max(0, Math.min(1, progress / 0.55));
      targetTime = duration > 0 ? scrubProgress * Math.max(0, duration - 0.02) : 0;

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

      // The hero line's exit: the whole line pulls toward the viewer while its
      // words burn off left to right, done by the time the statement opens.
      // Eased, not linear: the line should ease away and ease to a stop.
      const exitRaw = clamp01((progress - EXIT_FROM) / (EXIT_TO - EXIT_FROM));
      const exit = reduced ? (exitRaw >= 0.5 ? 1 : 0) : easeInOut(exitRaw);
      if (heroLine) {
        heroLine.style.transform = `scale(${(1 + (HERO_SCALE_TO - 1) * exit).toFixed(4)})`;
      }
      // One word's span, plus the stagger that walks the rest across the gap.
      const wordSpan = (EXIT_TO - EXIT_FROM) * WORD_SPAN;
      const stagger =
        heroWordCount > 1
          ? ((EXIT_TO - EXIT_FROM) - wordSpan) / (heroWordCount - 1)
          : 0;
      for (let i = 0; i < heroWordCount; i++) {
        const el = heroWordRefs.current[i];
        if (!el) continue;
        const raw = clamp01((progress - (EXIT_FROM + i * stagger)) / wordSpan);
        const w = reduced ? (raw >= 0.5 ? 1 : 0) : easeInOut(raw);

        const gone = clamp01((w - FADE_FROM) / (1 - FADE_FROM));
        const opacity = 1 - gone;
        const style = [
          wordColor(w),
          opacity.toFixed(3),
          (1 - (1 - WORD_SCALE_TO) * gone).toFixed(4),
          w > 0.08 && opacity > 0.02 ? HERO_GLOW : "none",
        ].join("|");
        if (lastWordStyle.current[i] === style) continue;
        lastWordStyle.current[i] = style;

        const [color, op, scale, glow] = style.split("|");
        el.style.color = color;
        el.style.opacity = op;
        el.style.transform = `scale(${scale})`;
        el.style.textShadow = glow;
      }

      // The hero video and glow are never faded out. The statement rectangle
      // simply expands over them until it covers the screen.

      // 0.55–0.92: a centred rectangle opens to the full viewport and the
      // statement is revealed through it. The photo is always at full viewport
      // size — only the clip moves, so nothing ever scales.
      const revealRaw = progress <= 0.55 ? 0 : progress >= 0.92 ? 1 : (progress - 0.55) / 0.37;
      const reveal = reduced ? (revealRaw >= 0.5 ? 1 : 0) : easeInOut(revealRaw);
      if (sImageEl) {
        const edge = 50 * (1 - reveal);
        sImageEl.style.clipPath = `inset(${edge}%)`;
      }

      // 0.80–1.00: headline, paragraph and CTA slide up into place. Translate
      // only — the opening clip above is what makes them appear.
      const contentRaw = progress <= 0.80 ? 0 : progress >= 1.00 ? 1 : (progress - 0.80) / 0.20;
      const contentProgress = reduced ? 1 : easeInOut(contentRaw);
      if (sContentEl) {
        sContentEl.style.transform = `translateY(${48 * (1 - contentProgress)}px)`;
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
  }, [heroWordCount]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[500vh] md:h-[600vh]"
      style={{ background: "var(--mm-navy)" }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        style={{ backgroundColor: "#0A0E14" }}
      >
        
        {/* Statement: sits above the hero video and is revealed by a centred
            rectangle that opens to the full viewport. The photo is always at
            full viewport size; only the clip animates, so nothing scales.
            The gradient underneath is the fallback for a missing file. */}
        <div
          ref={statementImageRef}
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{
            clipPath: "inset(50%)",
            willChange: "clip-path",
            background: "linear-gradient(45deg, #1A2433, #0A0E14)",
            zIndex: 45,
          }}
        >
          <Image
            src="/images/statement.jpeg"
            alt=""
            fill
            sizes="100vw"
            quality={80}
            className="object-cover"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black" style={{ opacity: 0.35 }} />

          {/* Inside the clip, so the opening rectangle is what reveals it —
              no opacity animation of its own. */}
          <div
            ref={statementContentRef}
            className="absolute inset-0 w-full h-full will-change-transform flex items-center justify-center flex-col px-6"
            style={{ transform: "translateY(48px)" }}
          >
            <h2 className="font-heading text-center font-medium leading-tight text-[clamp(2rem,6vw,5rem)] text-white mb-12">
              {tStatement("headlineLine1")}<br />{tStatement("headlineLine2")}
            </h2>

            <div className="flex flex-col items-center text-center max-w-lg">
              <p className="mm-body-copy mb-8">
                {tStatement("paragraph")}
              </p>
              <button className="px-8 py-3 bg-[#2D7FF9] font-semibold text-white uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300">
                {tStatement("startProject")}
              </button>
            </div>
          </div>
        </div>

        {/* Layer 1: Hero Video and Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0 will-change-transform"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 68%, rgba(45,127,249,0.13) 0%, rgba(45,127,249,0.04) 50%, transparent 80%)",
            zIndex: 1
          }}
        />

        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-[30%_center] md:object-center will-change-transform"
          style={{ zIndex: 2 }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.95) 100%)",
            zIndex: 4,
          }}
        />

        <div
          /* 15vh down the stage, but on a phone never closer to the top than
             the header, its safe area, and another 1.5rem on top of that. The
             extra is for the exit: the line scales to 1.35 about its own
             centre, so a heading that wraps to two lines grows some 20px
             upwards on its way out — which is what carried it up behind the
             header. Only the floor changes below `md`; the 15vh a desktop
             window actually resolves to is untouched. */
          className="absolute left-0 right-0 flex flex-col items-center pointer-events-none will-change-transform top-[clamp(100px,15vh,200px)] max-md:top-[clamp(calc(var(--mm-nav-safe)+1.5rem),15vh,200px)]"
          style={{
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            zIndex: 20,
          }}
        >
          <h1
            aria-label={tHero("heading")}
            className="font-heading text-center font-medium leading-none text-[clamp(2rem,5vw,4rem)] text-[#F5F5F0] will-change-transform"
            style={{ letterSpacing: "-0.02em", transformOrigin: "center", transform: "scale(1)" }}
            ref={heroLineRef}
          >
            {heroWords.map(({ chars, slot }, i) =>
              slot < 0 ? (
                <span key={i} aria-hidden="true">{chars}</span>
              ) : (
                <span
                  key={i}
                  aria-hidden="true"
                  ref={(el) => { heroWordRefs.current[slot] = el; }}
                  className="inline-block will-change-transform"
                  /* Ships in its resting state so there is no flash before
                     the loop starts. */
                  style={{ color: HERO_INK_CSS }}
                >
                  {chars}
                </span>
              )
            )}
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
            className="mm-meta text-xs tracking-widest uppercase"
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
            zIndex: 40,
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