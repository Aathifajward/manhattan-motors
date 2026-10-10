"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import {
  CARD_MARGIN_VH,
  LAST_CARD_VH,
  clamp01,
  useStackProgress,
} from "./stacked";

/**
 * On the homepage the footer is the last card in the stack: it rises over the
 * Sell card on a hard edge, with nothing covering it in turn. Every other route
 * gets the plain footer, flowing after the content as usual.
 */
export default function FooterStack({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  const apply = useCallback((p: number) => {
    if (!slideRef.current) return;
    // The whole of this card's scroll is its rise — nothing covers it after.
    const rise = 100 * (1 - clamp01(p));
    slideRef.current.style.transform = `translate3d(0, ${rise.toFixed(3)}%, 0)`;
  }, []);

  useStackProgress(sectionRef, stageRef, apply, 1);

  if (!isHome) return <>{children}</>;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${LAST_CARD_VH}vh`, marginTop: `${CARD_MARGIN_VH}vh`, zIndex: 50 }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div
          ref={slideRef}
          className="absolute inset-0 flex h-full w-full flex-col justify-end will-change-transform"
          style={{ transform: "translate3d(0, 100%, 0)", background: "#080B10" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
