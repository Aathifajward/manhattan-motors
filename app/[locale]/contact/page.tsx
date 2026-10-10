import { getLocale, getTranslations } from "next-intl/server";
import FadeInSection from "@/components/FadeInSection";
import InquiryForm, { SELL_TYPE } from "@/components/InquiryForm";
import {
  siteConfig,
  telHref,
  mailtoHref,
  addressFor,
  openingHoursFor,
} from "@/lib/siteConfig";

const BLUE = "#2D7FF9";
const BLUE_DIM = "rgba(45,127,249,0.15)";
const CARD = {
  background: "rgba(10,14,20,0.92)",
  border: "1px solid rgba(45,127,249,0.18)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
};

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
    <div className="mx-auto w-full max-w-6xl px-6 py-24">
      <FadeInSection>
        <span className="mm-label mb-6 inline-block">
          {selling ? t("sellLabel") : t("label")}
        </span>
        <h1 className="font-heading mb-6 font-medium leading-tight text-white text-[clamp(2rem,5vw,3.5rem)]">
          {selling ? t("sellTitle") : t("title")}
        </h1>
        <p className="mm-body-copy mb-16 max-w-2xl">
          {selling ? t("sellSubtitle") : t("subtitle")}
        </p>
      </FadeInSection>

      <div className="grid gap-16 lg:grid-cols-2">
        {/* ── Contact details ── */}
        <FadeInSection>
          <div
            className="flex flex-col gap-8 p-8"
            style={{ ...CARD, borderRadius: "6px 20px 6px 6px" }}
          >
            <div>
              <p className="mm-meta mb-2 text-xs uppercase tracking-widest" style={{ color: BLUE }}>
                {th("line")}
              </p>
              <a
                href={siteConfig.line.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
                style={{ background: "#06C755", borderRadius: "4px" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" />
                </svg>
                {siteConfig.line.id}
              </a>
            </div>

            <div>
              <p className="mm-meta mb-2 text-xs uppercase tracking-widest" style={{ color: BLUE }}>
                {th("phone")}
              </p>
              <a href={telHref} className="mm-meta text-xl text-white transition-opacity hover:opacity-70">
                {siteConfig.phone.display}
              </a>
            </div>

            <div>
              <p className="mm-meta mb-2 text-xs uppercase tracking-widest" style={{ color: BLUE }}>
                {th("email")}
              </p>
              <a
                href={mailtoHref}
                className="break-all text-base text-white transition-opacity hover:opacity-70"
              >
                {siteConfig.email}
              </a>
            </div>

            <div>
              <p className="mm-meta mb-2 text-xs uppercase tracking-widest" style={{ color: BLUE }}>
                {tl("addressLabel")}
              </p>
              <p className="whitespace-pre-line text-base leading-relaxed text-white/85">
                {addressFor(locale)}
              </p>
            </div>

            <div>
              <p className="mm-meta mb-2 text-xs uppercase tracking-widest" style={{ color: BLUE }}>
                {tl("hoursLabel")}
              </p>
              <p className="whitespace-pre-line text-base leading-relaxed text-white/85">
                {openingHoursFor(locale)}
              </p>
            </div>
          </div>
        </FadeInSection>

        {/* ── Inquiry form ── */}
        <FadeInSection
          delay={0.15}
          className="p-8"
          style={{ ...CARD, borderRadius: "20px 6px 6px 6px" }}
        >
          {sent === "true" && (
            <div
              className="mb-6 p-4 text-sm"
              style={{
                background: BLUE_DIM,
                border: "1px solid rgba(45,127,249,0.4)",
                color: BLUE,
                borderRadius: "4px",
              }}
            >
              {t("sent")}
            </div>
          )}
          <InquiryForm
            locale={locale}
            defaultType={selling ? SELL_TYPE : "Any"}
            returnTo="/contact"
          />
        </FadeInSection>
      </div>
    </div>
  );
}
