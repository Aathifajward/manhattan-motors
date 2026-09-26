"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const t = useTranslations("Nav");
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (isHome) {
      const handleHeroFrame = (e: Event) => {
        const { frameIndex, isScrollingDown } = (e as CustomEvent).detail;
        if (isScrollingDown && frameIndex >= 47) {
          setHidden(true);
        } else {
          setHidden(false);
        }
      };
      window.addEventListener("hero-frame", handleHeroFrame);
      return () => window.removeEventListener("hero-frame", handleHeroFrame);
    } else {
      let lastScrollY = window.scrollY;
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setHidden(true);
        } else {
          setHidden(false);
        }
        lastScrollY = currentScrollY;
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isHome]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-transparent py-6 ${
          hidden 
            ? "opacity-0 -translate-y-full pointer-events-none" 
            : "opacity-100 translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <img
              src="/images/manhattan-logo.png"
              alt="Manhattan Motors"
              className="transition-all duration-500 h-8 md:h-10 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }} 
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white">
            <Link href="/vehicles" className="hover:opacity-70 transition-opacity whitespace-nowrap">{t("vehicles")}</Link>
            <Link href="/about" className="hover:opacity-70 transition-opacity whitespace-nowrap">{t("about")}</Link>
            <Link href="/#contact" className="hover:opacity-70 transition-opacity whitespace-nowrap">{t("contact")}</Link>
            <LanguageSwitcher />
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay (Moved outside header so fixed inset-0 is relative to viewport) */}
      <div 
        className={`fixed inset-0 z-[100] transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        style={{
          background: '#0A0E14',
        }}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-12">
            <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <img
                src="/images/manhattan-logo.png"
                alt="Manhattan Motors"
                className="h-8 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }} 
              />
            </Link>
            <button 
              className="text-white p-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={28} />
            </button>
          </div>
          
          <nav className="flex flex-col gap-10 text-3xl font-bold text-white tracking-wide items-center justify-center flex-1">
            <Link href="/vehicles" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2D7FF9] transition-colors">{t("vehicles")}</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2D7FF9] transition-colors">{t("about")}</Link>
            <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#2D7FF9] transition-colors">{t("contact")}</Link>
          </nav>
          
          <div className="w-full flex flex-col items-center mt-auto pb-12 pt-8 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-6 font-bold">Language / 言語</p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
