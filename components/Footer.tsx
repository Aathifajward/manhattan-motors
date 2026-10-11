import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  siteConfig,
  telHref,
  mailtoHref,
  addressFor,
} from "@/lib/siteConfig";

/* Same near-black stage as the pages above it. One hairline across the top
   instead of a glow, and blue only where something is hovered. */

const BLACK = "#0a0a0a";
const RULE = "1px solid rgba(255,255,255,0.1)";

/** Small uppercase tracked labels, as everywhere else. */
const LABEL = "mm-meta text-[11px] uppercase tracking-[0.22em]";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" } as const;

/** Plain text links: grey at rest, blue on hover, never a box. */
const NAV_LINK = "font-body text-[13px] text-white/45 transition-colors duration-200 hover:text-[#2D7FF9]";

export default async function Footer() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();

  return (
    <footer className="relative w-full" style={{ background: BLACK, borderTop: RULE }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-14 py-20 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Logo + Tagline ── */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-6 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/manhattan-logo.png"
                alt="Manhattan Motors"
                className="h-9 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            <p className="font-body text-[13px] leading-relaxed text-white/40">
              {t("tagline")}
            </p>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h4 className={`${LABEL} mb-6`} style={LABEL_STYLE}>
              {t("quickLinks")}
            </h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/vehicles" className={NAV_LINK}>
                  {t("linkVehicles")}
                </Link>
              </li>
              <li>
                <Link href="/about" className={NAV_LINK}>
                  {t("linkAbout")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={NAV_LINK}>
                  {t("linkContact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Contact Info ── */}
          <div className="lg:col-span-2">
            <h4 className={`${LABEL} mb-6`} style={LABEL_STYLE}>
              {t("contactInfo")}
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mm-meta mb-1.5 text-[10px] uppercase tracking-widest text-white/25">{t("phone")}</p>
                  <a href={telHref} className="font-body text-[13px] text-white transition-colors duration-200 hover:text-[#2D7FF9]">{siteConfig.phone.display}</a>
                </div>
                <div>
                  <p className="mm-meta mb-1.5 text-[10px] uppercase tracking-widest text-white/25">{t("email")}</p>
                  <a href={mailtoHref} className="font-body break-all text-[13px] text-white transition-colors duration-200 hover:text-[#2D7FF9]">{siteConfig.email}</a>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mm-meta mb-1.5 text-[10px] uppercase tracking-widest text-white/25">{t("line")}</p>
                  {/* The one icon down here: monochrome, and blue only when
                      the whole link is hovered. */}
                  <a href={siteConfig.line.url} target="_blank" rel="noopener noreferrer" className="group font-body inline-flex items-center gap-2 text-[13px] text-white transition-colors duration-200 hover:text-[#2D7FF9]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white/45 transition-colors duration-200 group-hover:text-[#2D7FF9]" aria-hidden="true"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" /></svg>
                    {siteConfig.line.id}
                  </a>
                </div>
                <div>
                  <p className="mm-meta mb-1.5 text-[10px] uppercase tracking-widest text-white/25">{t("address")}</p>
                  <p className="font-body whitespace-pre-line text-[13px] leading-relaxed text-white/45">
                    {addressFor(locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 py-7 sm:flex-row" style={{ borderTop: RULE }}>
          <div className="font-body flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/25">
            <span>© {new Date().getFullYear()} Manhattan Motors. {t("rights")}</span>
            <span>{t("license")}</span>
          </div>
          <Link href="/admin" className="font-body text-[11px] text-white/20 transition-colors duration-200 hover:text-[#2D7FF9]">
            {t("admin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
