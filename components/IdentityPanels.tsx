"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function IdentityPanels() {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  const bg1Ref = useRef<HTMLDivElement>(null);
  const bg2Ref = useRef<HTMLDivElement>(null);
  const bg3Ref = useRef<HTMLDivElement>(null);
  
  const img1Ref = useRef<HTMLImageElement>(null);
  const img2Ref = useRef<HTMLImageElement>(null);
  const img3Ref = useRef<HTMLImageElement>(null);
  
  const textColRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);

  const t = useTranslations("IdentityPanels");

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    const panel = panelRef.current;
    if (!container || !sticky || !panel) return;

    let disposed = false;
    let rafId = 0;
    
    // Backgrounds
    const bg1 = bg1Ref.current;
    const bg2 = bg2Ref.current;
    const bg3 = bg3Ref.current;
    
    // Images
    const img1 = img1Ref.current;
    const img2 = img2Ref.current;
    const img3 = img3Ref.current;
    
    // Texts
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    const t3 = text3Ref.current;

    const tick = () => {
      rafId = 0;
      if (disposed) return;
      
      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - sticky.offsetHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      
      // The panel slides up from the bottom (translateY 100% to 0) over the full-screen photo.
      // 0.00-0.15: slide up
      const slideUp = progress <= 0.15 ? 1 - progress / 0.15 : 0;
      panel.style.transform = `translateY(${slideUp * 100}%)`;
      
      // Crossfade backgrounds
      if (bg1 && bg2 && bg3) {
        // bg1 fades out during 0.45-0.55
        const bg1Op = progress < 0.45 ? 1 : progress > 0.55 ? 0 : 1 - (progress - 0.45) / 0.1;
        // bg2 fades in during 0.45-0.55, fades out 0.80-0.90
        const bg2Op = progress < 0.45 ? 0 : progress > 0.90 ? 0 :
                      progress < 0.55 ? (progress - 0.45) / 0.1 : 
                      progress > 0.80 ? 1 - (progress - 0.80) / 0.1 : 1;
        // bg3 fades in 0.80-0.90
        const bg3Op = progress < 0.80 ? 0 : progress > 0.90 ? 1 : (progress - 0.80) / 0.1;
        
        bg1.style.opacity = String(bg1Op);
        bg2.style.opacity = String(bg2Op);
        bg3.style.opacity = String(bg3Op);
      }

      // Switch Images
      if (img1 && img2 && img3) {
        // img2 animation 0.45 - 0.55
        const img2Op = progress < 0.45 ? 0 : progress > 0.55 ? 1 : (progress - 0.45) / 0.1;
        const img2Scale = 0.6 + 0.4 * img2Op;
        img2.style.opacity = String(img2Op);
        img2.style.transform = `scale(${img2Scale})`;

        // img3 animation 0.80 - 0.90
        const img3Op = progress < 0.80 ? 0 : progress > 0.90 ? 1 : (progress - 0.80) / 0.1;
        const img3Scale = 0.6 + 0.4 * img3Op;
        img3.style.opacity = String(img3Op);
        img3.style.transform = `scale(${img3Scale})`;
      }

      // Texts
      if (t1 && t2 && t3) {
        // Text 1 slides out 0.45 - 0.55
        const t1Out = progress < 0.45 ? 0 : progress > 0.55 ? 1 : (progress - 0.45) / 0.1;
        t1.style.opacity = String(1 - t1Out);
        t1.style.transform = `translateY(${-t1Out * 30}px)`;
        t1.style.pointerEvents = t1Out === 0 ? "auto" : "none";

        // Text 2 slides in 0.45 - 0.55, out 0.80 - 0.90
        const t2In = progress < 0.45 ? 0 : progress > 0.55 ? 1 : (progress - 0.45) / 0.1;
        const t2Out = progress < 0.80 ? 0 : progress > 0.90 ? 1 : (progress - 0.80) / 0.1;
        t2.style.opacity = String(t2In - t2Out);
        t2.style.transform = `translateY(${30 * (1 - t2In) - 30 * t2Out}px)`;
        t2.style.pointerEvents = t2In === 1 && t2Out === 0 ? "auto" : "none";

        // Text 3 slides in 0.80 - 0.90
        const t3In = progress < 0.80 ? 0 : progress > 0.90 ? 1 : (progress - 0.80) / 0.1;
        t3.style.opacity = String(t3In);
        t3.style.transform = `translateY(${30 * (1 - t3In)}px)`;
        t3.style.pointerEvents = t3In === 1 ? "auto" : "none";
      }

      rafId = requestAnimationFrame(tick);
    };

    tick();

    const onScrollOrResize = () => {
      if (!rafId && !disposed) rafId = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const IMG_1 = "/images/frames/frame_000020.webp";
  const IMG_2 = "/images/frames/frame_000040.webp";
  const IMG_3 = "/images/frames/frame_000060.webp";

  return (
    <section ref={containerRef} className="relative w-full h-[500vh] sm:h-[400vh] -mt-[100vh]" style={{ zIndex: 10 }}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden pointer-events-none">
        
        {/* The sliding glass panel */}
        <div ref={panelRef} className="absolute inset-0 w-full h-full will-change-transform flex items-center justify-center pointer-events-auto overflow-hidden">
          
          {/* Background Layer: crossfading scaled images */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div ref={bg1Ref} className="absolute inset-0 w-full h-full will-change-transform bg-cover bg-center opacity-100" style={{ backgroundImage: `url(${IMG_1})`, transform: "scale(2)", filter: "blur(0)" }}></div>
            <div ref={bg2Ref} className="absolute inset-0 w-full h-full will-change-transform bg-cover bg-center opacity-0" style={{ backgroundImage: `url(${IMG_2})`, transform: "scale(2)", filter: "blur(0)" }}></div>
            <div ref={bg3Ref} className="absolute inset-0 w-full h-full will-change-transform bg-cover bg-center opacity-0" style={{ backgroundImage: `url(${IMG_3})`, transform: "scale(2)", filter: "blur(0)" }}></div>
            {/* Navy Overlay */}
            <div className="absolute inset-0 bg-[#0A0E14] opacity-80"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl px-6 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 h-full py-20">
            {/* Left: Images */}
            <div className="relative w-full max-w-sm md:max-w-md shrink-0 aspect-[4/5] rounded-xl border border-white/20 overflow-hidden shadow-2xl">
              <img ref={img1Ref} src={IMG_1} alt="Panel 1" className="absolute inset-0 w-full h-full object-cover will-change-transform opacity-100" />
              <img ref={img2Ref} src={IMG_2} alt="Panel 2" className="absolute inset-0 w-full h-full object-cover will-change-transform opacity-0 scale-75" />
              <img ref={img3Ref} src={IMG_3} alt="Panel 3" className="absolute inset-0 w-full h-full object-cover will-change-transform opacity-0 scale-75" />
            </div>

            {/* Right: Text Container */}
            <div ref={textColRef} className="relative w-full md:w-1/2 h-[250px] md:h-[300px] flex items-center shrink-0">
              {/* Text 1 */}
              <div ref={text1Ref} className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-center will-change-transform text-center md:text-left">
                <span className="text-[#2D7FF9] text-sm font-bold tracking-widest mb-4">01 / 03</span>
                <h2 className="font-heading text-4xl md:text-5xl text-white mb-6 leading-tight">{t("panel1Title")}</h2>
                <p className="text-white/70 text-lg md:text-xl mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">{t("panel1Text")}</p>
                <div>
                  <Link href="/vehicles" className="inline-block px-8 py-3 bg-[#2D7FF9] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300">
                    {t("panel1Button")}
                  </Link>
                </div>
              </div>

              {/* Text 2 */}
              <div ref={text2Ref} className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-center will-change-transform opacity-0 translate-y-8 text-center md:text-left">
                <span className="text-[#2D7FF9] text-sm font-bold tracking-widest mb-4">02 / 03</span>
                <h2 className="font-heading text-4xl md:text-5xl text-white mb-6 leading-tight">{t("panel2Title")}</h2>
                <p className="text-white/70 text-lg md:text-xl mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">{t("panel2Text")}</p>
                <div>
                  <Link href="/#contact" className="inline-block px-8 py-3 bg-[#2D7FF9] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300">
                    {t("panel2Button")}
                  </Link>
                </div>
              </div>

              {/* Text 3 */}
              <div ref={text3Ref} className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-center will-change-transform opacity-0 translate-y-8 text-center md:text-left">
                <span className="text-[#2D7FF9] text-sm font-bold tracking-widest mb-4">03 / 03</span>
                <h2 className="font-heading text-4xl md:text-5xl text-white mb-6 leading-tight">{t("panel3Title")}</h2>
                <p className="text-white/70 text-lg md:text-xl mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">{t("panel3Text")}</p>
                <div>
                  <Link href="/#contact" className="inline-block px-8 py-3 bg-[#2D7FF9] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-white hover:text-black transition-colors duration-300">
                    {t("panel3Button")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
