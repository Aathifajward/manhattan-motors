"use client";

/**
 * Every way the viewport can change size, in one subscription.
 *
 * `resize` on its own is not enough on a phone. A mobile browser retracting or
 * restoring its address bar changes how much of the page is visible, and with
 * the stages measured in `dvh` it changes how tall they are — but several
 * browsers report that on `visualViewport` and not on `window`, and some
 * report an orientation change only through `orientationchange`. Anything that
 * caches a height, a section's offset or a scroll range has to hear about all
 * of it, or it spends the rest of the session animating against numbers taken
 * when the address bar was still down.
 *
 * Handlers must be idempotent — a single gesture can deliver several of these.
 */
export function onViewportChange(handler: () => void): () => void {
  window.addEventListener("resize", handler, { passive: true });
  window.addEventListener("orientationchange", handler, { passive: true });
  const visual = window.visualViewport;
  visual?.addEventListener("resize", handler, { passive: true });

  return () => {
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
    visual?.removeEventListener("resize", handler);
  };
}
