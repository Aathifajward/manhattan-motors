import { getLocale, getTranslations } from "next-intl/server";
import Reveal from "@/components/Reveal";
import InquiryForm, { SELL_TYPE } from "@/components/InquiryForm";
import {
  siteConfig,
  telHref,
  mailtoHref,
  addressFor,
  openingHoursFor,
} from "@/lib/siteConfig";

/* Same vocabulary as the listing and detail pages: near-black stage, Clash
   Display headings, hairline rules instead of cards, blue kept to accents. */

const BLACK = "#0a0a0a";
const BLUE = "#2D7FF9";

/** Small uppercase tracked labels — the form's own treatment. */
const LABEL = "mm-meta text-[11px] uppercase tracking-[0.22em]";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" } as const;

const RULE = "1px solid rgba(255,255,255,0.1)";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sent?: string }>;
}) {
  const { type, sent } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("ContactPage");
  const th = await getTranslations("HomePage");
  const tl = await getTranslations("LocationSection");

  // ?type=sell arrives from the sell section's CTA.
  const selling = type === "sell";

  return (
    <div className="-mt-[88px] w-full pt-[88px]" style={{ background: BLACK, minHeight: "100vh" }}>
      <div className="mx-auto w-full max-w-6xl px-6 pb-32 pt-20 md:pt-28 lg:px-8">
        <Reveal>
          <span className="mm-label mb-7 inline-block">
            {selling ? t("sellLabel") : t("label")}
          </span>
          <h1
            className="font-heading mb-7 font-medium text-white text-[clamp(2.25rem,5vw,4rem)]"
            style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            {selling ? t("sellTitle") : t("title")}
          </h1>
          <p className="mm-body-copy mb-20 max-w-2xl">
            {selling ? t("sellSubtitle") : t("subtitle")}
          </p>
        </Reveal>

        <div className="grid gap-20 lg:grid-cols-2 lg:gap-24">
          {/* ── Contact details — plain stacked text, no card ── */}
          <div>
            <div className="flex flex-col" style={{ borderTop: RULE }}>
              <Reveal delay={0} className="py-7" style={{ borderBottom: RULE }}>
                <p className={`${LABEL} mb-3`} style={LABEL_STYLE}>{th("line")}</p>
                <a
                  href={siteConfig.line.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base text-white transition-opacity hover:opacity-70"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: "#06C755" }} aria-hidden="true">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" />
                  </svg>
                  {siteConfig.line.id}
                </a>
              </Reveal>

              <Reveal delay={50} className="py-7" style={{ borderBottom: RULE }}>
                <p className={`${LABEL} mb-3`} style={LABEL_STYLE}>{th("phone")}</p>
                <a href={telHref} className="mm-meta text-2xl text-white transition-opacity hover:opacity-70">
                  {siteConfig.phone.display}
                </a>
              </Reveal>

              <Reveal delay={100} className="py-7" style={{ borderBottom: RULE }}>
                <p className={`${LABEL} mb-3`} style={LABEL_STYLE}>{th("email")}</p>
                <a
                  href={mailtoHref}
                  className="font-body break-all text-base text-white transition-opacity hover:opacity-70"
                >
                  {siteConfig.email}
                </a>
              </Reveal>

              <Reveal delay={150} className="py-7" style={{ borderBottom: RULE }}>
                <p className={`${LABEL} mb-3`} style={LABEL_STYLE}>{tl("addressLabel")}</p>
                <p className="font-body whitespace-pre-line text-base leading-relaxed text-white/70">
                  {addressFor(locale)}
                </p>
              </Reveal>

              <Reveal delay={200} className="py-7" style={{ borderBottom: RULE }}>
                <p className={`${LABEL} mb-3`} style={LABEL_STYLE}>{tl("hoursLabel")}</p>
                <p className="font-body whitespace-pre-line text-base leading-relaxed text-white/70">
                  {openingHoursFor(locale)}
                </p>
              </Reveal>
            </div>
          </div>

          {/* ── Inquiry form — straight onto the black, no container ── */}
          <Reveal delay={120}>
            {sent === "true" && (
              <p
                className={`${LABEL} mb-10 inline-block pb-2.5`}
                style={{ color: BLUE, borderBottom: `1px solid ${BLUE}` }}
              >
                {t("sent")}
              </p>
            )}
            <InquiryForm
              locale={locale}
              defaultType={selling ? SELL_TYPE : "Any"}
              returnTo="/contact"
            />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
