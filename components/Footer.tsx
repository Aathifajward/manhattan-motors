import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Footer() {
  const t = await getTranslations("Footer");

  const BLUE = "#2D7FF9";

  return (
    <footer className="relative w-full overflow-hidden" style={{ background: '#080B10' }}>
      {/* Top border glow */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(45,127,249,0.35), transparent)' }} />

      {/* Ambient glow blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(45,127,249,0.05) 0%, transparent 70%)' }} />

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Logo + Tagline ── */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-5">
              <img
                src="/images/logo.png"
                alt="Manhattan Motors"
                className="h-9 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t("tagline")}
            </p>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: BLUE }}>
              {t("quickLinks")}
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/vehicles" className="text-[13px] font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t("linkVehicles")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[13px] font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t("linkAbout")}
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-[13px] font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t("linkContact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Contact Info ── */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: BLUE }}>
              {t("contactInfo")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Phone</p>
                  <a href="tel:090-3959-3883" className="text-[13px] font-medium text-white hover:opacity-70 transition-opacity">090-3959-3883</a>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Email</p>
                  <a href="mailto:manhattanmotors.726@gmail.com" className="text-[13px] font-medium text-white hover:opacity-70 transition-opacity break-all">manhattanmotors.726@gmail.com</a>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>LINE</p>
                  <a href="https://line.me/ti/p/~Maz615" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white hover:opacity-70 transition-opacity">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" style={{ color: '#06C755' }}><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" /></svg>
                    Maz615
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Address</p>
                  <p className="text-[13px] font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    3-12-5 Hitotsugi-cho<br />Kariya City, Aichi 448-0003<br />Japan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span>© {new Date().getFullYear()} Manhattan Motors. {t("rights")}</span>
            <span>{t("license")}</span>
          </div>
          <Link href="/admin" className="text-[11px] font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
