"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePathname } from "@/i18n/navigation";

export default function Navbar() {
  const t = useTranslations("Nav");
  const [hidden, setHidden] = useState(false);
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

  return (
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
            src="/images/logo.png"
            alt="Manhattan Motors"
            className="transition-all duration-500 h-10 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }} 
          />
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium text-white">
          <Link href="/vehicles" className="hover:opacity-70 transition-opacity">{t("vehicles")}</Link>
          <Link href="/about" className="hover:opacity-70 transition-opacity">{t("about")}</Link>
          <Link href="/#contact" className="hover:opacity-70 transition-opacity">{t("contact")}</Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
