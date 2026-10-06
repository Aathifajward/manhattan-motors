import { useEffect } from 'react';

export function useScrollProgress(
  containerRef: React.RefObject<HTMLElement | null>,
  stickyRef: React.RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void
) {
  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    if (!container || !sticky) return;

    let rafId = 0;
    let inView = false;
    let disposed = false;
    let easedTime = 0;
    let targetTime = 0;
    
    const computeProgress = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const p = scrollable > 0 ? -rect.top / scrollable : 0;
      return Math.min(1, Math.max(0, p));
    };

    const tick = () => {
      rafId = 0;
      if (disposed) return;
      
      targetTime = computeProgress();
      easedTime += (targetTime - easedTime) * 0.2;
      
      if (Math.abs(targetTime - easedTime) < 0.001) {
        easedTime = targetTime;
      }
      
      onProgress(easedTime);
      
      if (inView || Math.abs(targetTime - easedTime) >= 0.001) {
        rafId = requestAnimationFrame(tick);
      }
    };
    
    const kick = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? false;
      if (inView) kick();
    }, { rootMargin: "200px 0px" });
    io.observe(container);
    
    const onScrollOrResize = () => {
      if (inView) kick();
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    
    // Initial run
    kick();
    
    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [containerRef, stickyRef, onProgress]);
}
