import { getTranslations } from "next-intl/server";
import Reveal from "@/components/Reveal";

/* Same vocabulary as the rest of the site: near-black stage, Clash Display
   headings, DM Sans copy, hairline rules instead of cards, blue on hover. */

const BLACK = "#0a0a0a";

/** Small uppercase tracked labels. */
const LABEL = "mm-meta text-[11px] uppercase tracking-[0.22em]";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" } as const;

const RULE = "1px solid rgba(255,255,255,0.1)";

/** One fact: label left, value right, a hairline under it. `delay` is the
 *  row's place in the stagger as the list comes into view. */
function Row({
  label,
  delay = 0,
  children,
}: {
  label: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay} className="flex items-baseline justify-between gap-6 py-4" style={{ borderBottom: RULE }}>
      <dt className="font-body text-[13px] text-white/40">{label}</dt>
      <dd className="font-body text-right text-[13px] text-white">{children}</dd>
    </Reveal>
  );
}

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <div className="-mt-[88px] w-full pt-[88px]" style={{ background: BLACK, minHeight: "100dvh" }}>
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-20 md:pt-28 lg:px-8">
        <Reveal>
          <h1
            className="font-heading mb-8 font-medium text-white text-[clamp(2.25rem,5vw,4rem)]"
            style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            {t("title")}
          </h1>
          <p className="mm-body-copy mb-20 max-w-2xl">{t("body")}</p>
        </Reveal>

        <div className="grid gap-16 sm:grid-cols-2 sm:gap-20">
          <Reveal delay={80}>
            <h2 className={`${LABEL} mb-5`} style={LABEL_STYLE}>{t("companyInfo")}</h2>
            <dl className="flex flex-col" style={{ borderTop: RULE }}>
              <Row label={t("companyName")} delay={0}>{t("companyNameValue")}</Row>
              <Row label={t("businessType")} delay={50}>{t("businessTypeValue")}</Row>
              <Row label={t("representative")} delay={100}>{t("representativeValue")}</Row>
              <Row label={t("address")} delay={150}>{t("addressValue")}</Row>
            </dl>
          </Reveal>

          <Reveal delay={160}>
            <h2 className={`${LABEL} mb-5`} style={LABEL_STYLE}>{t("contact")}</h2>
            <dl className="flex flex-col" style={{ borderTop: RULE }}>
              <Row label={t("mobile")} delay={0}>
                <a href="tel:090-3959-3883" className="text-white transition-colors hover:text-[#2D7FF9]">
                  090-3959-3883
                </a>
              </Row>
              <Row label={t("landline")} delay={50}>0566-93-3976</Row>
              <Row label={t("email")} delay={100}>
                <a href="mailto:manhattanmotors.726@gmail.com" className="break-all text-white transition-colors hover:text-[#2D7FF9]">
                  manhattanmotors.726@gmail.com
                </a>
              </Row>
              <Row label={t("lineId")} delay={150}>
                <a
                  href="https://line.me/ti/p/~Maz615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white transition-opacity hover:opacity-70"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#06C755" }} aria-hidden="true">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" />
                  </svg>
                  Maz615
                </a>
              </Row>
            </dl>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
