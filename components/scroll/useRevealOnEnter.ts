import { useEffect } from "react";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Rises every `[data-reveal]` descendant from translateY(60px) to 0 with a
 * fade, once, when the section first enters the viewport.
 *
 * Transform and opacity only, written straight to the DOM — no per-frame React
 * state, same as the rest of the scroll film. Elements must ship their start
 * state inline (`opacity: 0; transform: translateY(60px)`) so there's no flash
 * before hydration. Under prefers-reduced-motion the end state is applied
 * immediately with no transition.
 */
export function useRevealOnEnter(
  sectionRef: React.RefObject<HTMLElement | null>,
  { threshold = 0.2, stagger = 90, duration = 700 }: {
    threshold?: number;
    stagger?: number;
    duration?: number;
  } = {}
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const targets = Array.from(
      section.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (targets.length === 0) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const show = (el: HTMLElement, i: number) => {
      el.style.transitionDelay = reduced ? "0ms" : `${i * stagger}ms`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    };

    if (reduced) {
      targets.forEach((el, i) => {
        el.style.transition = "none";
        show(el, i);
      });
      return;
    }

    targets.forEach((el) => {
      el.style.transition = `opacity ${duration}ms ${EASE}, transform ${duration}ms ${EASE}`;
    });

    let revealed = false;

    const stop = () => {
      io.disconnect();
      window.removeEventListener("scroll", maybeReveal);
      window.removeEventListener("resize", maybeReveal);
      document.removeEventListener("visibilitychange", maybeReveal);
    };

    const revealAll = () => {
      if (revealed) return;
      revealed = true;
      targets.forEach(show);
      stop(); // reveal once, then stop listening
    };

    // Safety net: a plain geometry check, because the observer only gets one
    // chance. IntersectionObserver delivery is suspended while a tab is hidden,
    // so a section that crosses the threshold in a background tab never fires
    // its callback and the copy would stay at opacity 0 for good.
    function maybeReveal() {
      const rect = section!.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (rect.top < vh * 0.9 && rect.bottom > 0) revealAll();
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) revealAll();
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(section);
    window.addEventListener("scroll", maybeReveal, { passive: true });
    window.addEventListener("resize", maybeReveal, { passive: true });
    document.addEventListener("visibilitychange", maybeReveal);

    maybeReveal(); // already on screen at mount

    return stop;
  }, [sectionRef, threshold, stagger, duration]);
}

/** Start state for a `[data-reveal]` element. Spread into `style`. */
export const revealStart = {
  opacity: 0,
  transform: "translateY(60px)",
  willChange: "opacity, transform",
} as const;
