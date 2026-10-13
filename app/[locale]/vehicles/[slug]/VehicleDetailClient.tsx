"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import Reveal, { hidden, useParallax, useRevealList } from "@/components/Reveal";
import { MotionLink, MotionExternalLink, MotionButton } from "@/components/MotionElements";

/* ── Shared visual language, the same vocabulary the listing page uses ─────
   Near-black stage, Clash Display for headings and meta, DM Sans for copy,
   hairline rules instead of boxes, and blue kept to thin accents: the mark
   under the price, the active thumbnail, one filled button.

   Layout note: the hero is the gallery beside the title, price and calls to
   action — and nothing else. The overview used to sit in that right-hand
   column, which made it the taller of the two and left a column of dead
   space under the image before the description. It now runs full width in
   the normal flow, so image, overview and description share one rhythm.  */

const BLACK = "#0a0a0a";
const BLUE = "#2D7FF9";

/** The one spacing step between sections. */
const SECTION_GAP = "72px";

/** Small uppercase tracked labels — the contact form's treatment. */
const LABEL = "mm-meta text-[11px] uppercase tracking-[0.22em]";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" } as const;

/** The hairline that separates rows instead of a card boxing them in. */
const RULE = "1px solid rgba(255,255,255,0.1)";

/** Buttons: one filled, one outline, both square and wide-tracked. */
const BTN =
  "mm-meta flex items-center justify-center gap-2 px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-80";
const BTN_SOLID = { background: BLUE, borderRadius: 0 } as const;
const BTN_OUTLINE = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 0,
} as const;

/** How far the main photo drifts, and the slack it is given so the drift can
 *  never pull its own edge into the frame. */
const DRIFT_PX = 14;
const DRIFT_SLACK = "2rem"; // 32px, comfortably more than 2 x DRIFT_PX

export default function VehicleDetailClient({
  vehicle,
  locale,
  description,
  showFallbackNote
}: {
  vehicle: any;
  locale: string;
  description: string | null;
  showFallbackNote: boolean;
}) {
  const t = useTranslations("VehicleDetailPage");
  const tLabels = useTranslations("VehicleLabels");
  const tHome = useTranslations("HomePage");

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  const conditionLabels: Record<string, string> = {
    excellent: tLabels("condition.excellent"),
    good: tLabels("condition.good"),
    fair: tLabels("condition.fair"),
  };
  const transmissionLabels: Record<string, string> = {
    automatic: tLabels("transmission.automatic"),
    manual: tLabels("transmission.manual"),
  };
  const fuelTypeLabels: Record<string, string> = {
    petrol: tLabels("fuelType.petrol"),
    diesel: tLabels("fuelType.diesel"),
    hybrid: tLabels("fuelType.hybrid"),
    electric: tLabels("fuelType.electric"),
  };
  const statusLabels: Record<string, string> = {
    available: tLabels("status.available"),
    reserved: tLabels("status.reserved"),
    sold: tLabels("status.sold"),
  };

  const images = vehicle.images || [];
  const mainImage = images[activeImageIdx]?.url || "";

  /** The overview, as rows rather than a grid of boxes. Optional fields drop
   *  out of the list instead of leaving an empty cell behind. */
  const specs: Array<[string, string]> = [
    [t("status"), statusLabels[vehicle.status] ?? vehicle.status],
    [t("year"), String(vehicle.year)],
    [t("category"), tLabels(`category.${vehicle.category}`)],
    ...(vehicle.transmission
      ? ([[t("transmission"), transmissionLabels[vehicle.transmission] ?? vehicle.transmission]] as Array<[string, string]>)
      : []),
    ...(vehicle.mileageKm != null
      ? ([[t("mileage"), `${vehicle.mileageKm.toLocaleString()} km`]] as Array<[string, string]>)
      : []),
    ...(vehicle.fuelType
      ? ([[t("fuelType"), fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType]] as Array<[string, string]>)
      : []),
    ...(vehicle.color ? ([[t("color"), vehicle.color]] as Array<[string, string]>) : []),
    [t("price"), priceFormatter.format(vehicle.priceJpy)],
  ];

  /** The line of facts under the title — plain tracked text, no pills. */
  const facts = [
    tLabels(`category.${vehicle.category}`),
    String(vehicle.year),
    vehicle.transmission ? transmissionLabels[vehicle.transmission] ?? vehicle.transmission : null,
    statusLabels[vehicle.status] ?? vehicle.status,
  ].filter(Boolean) as string[];

  /** Overview rows arrive one after another as the table comes into view. */
  const specRefs = useRevealList(specs.length, 45);

  /** A few pixels of drift on the main photo. Nothing more than that. */
  const mainImageRef = useRef<HTMLImageElement>(null);
  useParallax(mainImageRef, DRIFT_PX);

  return (
    <div className="-mt-[88px] w-full pt-[88px]" style={{ background: BLACK, minHeight: "100dvh" }}>
      <div
        className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-28 pt-16 md:pt-20 lg:px-8"
        style={{ gap: SECTION_GAP }}
      >

        {/* ── Breadcrumb ── */}
        <nav className={`${LABEL} flex items-center gap-2.5`} style={LABEL_STYLE}>
          <Link href="/" className="transition-colors hover:text-white">{t("home")}</Link>
          <span className="text-white/20">/</span>
          <Link href="/vehicles" className="transition-colors hover:text-white">{t("vehicles")}</Link>
          <span className="text-white/20">/</span>
          <span className="text-white">{vehicle.make} {vehicle.model}</span>
        </nav>

        {/* ── Hero: the gallery beside the headline facts, nothing else ── */}
        <div className="grid w-full grid-cols-1 items-start gap-12 lg:grid-cols-[58%_1fr] lg:gap-16">

          {/* ── Left: gallery ── */}
          <Reveal className="flex w-full flex-col gap-4">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              {mainImage ? (
                // Taller than its frame by DRIFT_SLACK, so the drift can
                // never pull an edge into view.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={mainImageRef}
                  src={mainImage}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="absolute inset-x-0 w-full object-cover will-change-transform"
                  style={{ top: `calc(${DRIFT_SLACK} / -2)`, height: `calc(100% + ${DRIFT_SLACK})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white/20">{t("noImage")}</div>
              )}
            </div>

            {/* A single photo gets no gallery chrome at all. */}
            {images.length > 1 && (
              <div className="hide-scrollbar flex w-full snap-x gap-3 overflow-x-auto pb-2">
                {images.map((img: any, idx: number) => {
                  const isActive = idx === activeImageIdx;
                  return (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIdx(idx)}
                      aria-current={isActive}
                      className="group relative shrink-0 snap-start overflow-hidden"
                      style={{ width: "100px", height: "75px", borderRadius: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-100"
                        style={{ opacity: isActive ? 1 : 0.45 }}
                      />
                      {/* The active one is marked by a hairline, not a box. */}
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 bottom-0 h-px transition-opacity duration-300 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ background: BLUE }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </Reveal>

          {/* ── Right: title, price, calls to action ── */}
          <Reveal delay={80}>
            <h1
              className="font-heading mb-5 font-medium text-white text-[clamp(2rem,4vw,3.25rem)]"
              style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>

            {/* Facts as tracked text — the coloured status pill is gone. */}
            <div className={`${LABEL} mb-10 flex flex-wrap items-center gap-x-3 gap-y-2`} style={LABEL_STYLE}>
              {facts.map((fact, i) => (
                <span key={i} className="flex items-center gap-3">
                  {i > 0 && <span className="text-white/15">·</span>}
                  <span className={i === facts.length - 1 ? "text-white/70" : undefined}>{fact}</span>
                </span>
              ))}
            </div>

            {/* Price: white, with the blue kept to the mark under it. */}
            <p
              className="mm-meta mb-10 inline-block pb-3 text-white text-[clamp(2rem,3.4vw,3rem)]"
              style={{ letterSpacing: "-0.02em", borderBottom: `1px solid ${BLUE}` }}
            >
              {priceFormatter.format(vehicle.priceJpy)}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <MotionLink
                href="/contact"
                className={`${BTN} flex-1`}
                style={BTN_OUTLINE}
                fullWidth={true}
              >
                {t("contactUs")}
              </MotionLink>
              <MotionExternalLink
                href="https://line.me/ti/p/~Maz615"
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN} flex-1`}
                style={BTN_SOLID}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" /></svg>
                {t("messageLine")}
              </MotionExternalLink>
              <MotionButton
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url: window.location.href });
                  }
                }}
                className="flex w-14 shrink-0 items-center justify-center text-white/50 transition-colors duration-200 hover:text-white"
                style={BTN_OUTLINE}
              >
                <Share2 size={16} />
              </MotionButton>
            </div>
          </Reveal>
        </div>

        {/* ── Overview: full width, in the flow, rows arriving in sequence ── */}
        <section>
          <Reveal>
            <h2 className={`${LABEL} mb-5`} style={LABEL_STYLE}>{t("overview")}</h2>
          </Reveal>
          <dl className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16" style={{ borderTop: RULE }}>
            {specs.map(([label, value], i) => (
              <div
                key={label}
                ref={(el) => { specRefs.current[i] = el; }}
                className="flex items-baseline justify-between gap-6 py-3.5"
                style={{ ...hidden, borderBottom: RULE }}
              >
                <dt className="font-body text-[13px] text-white/40">{label}</dt>
                <dd className="font-body text-right text-[13px] text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Description ── */}
        {description && (
          <Reveal>
            <section>
              <h2 className={`${LABEL} mb-5`} style={LABEL_STYLE}>{t("description")}</h2>
              {showFallbackNote && (
                <p className="mb-4 text-xs italic text-white/35">
                  {t("descriptionFallbackNote")}
                </p>
              )}
              <div
                className="font-body max-w-3xl whitespace-pre-line pt-6 text-[15px] leading-relaxed text-white/70"
                style={{ borderTop: RULE }}
              >
                {description}
              </div>
            </section>
          </Reveal>
        )}

        {/* ── Location ── */}
        <Reveal>
          <section>
            <h2 className={`${LABEL} mb-5`} style={LABEL_STYLE}>{t("location")}</h2>
            <div className="flex flex-col md:flex-row" style={{ borderTop: RULE }}>
              <div className="flex shrink-0 flex-col justify-center py-10 md:w-80 md:pr-10">
                <div className={`${LABEL} mb-2`} style={LABEL_STYLE}>{tHome("addressLabel")}</div>
                <p className="font-body mb-8 whitespace-pre-line text-[14px] leading-relaxed text-white/70">{tHome("addressValueMap")}</p>
                <div className={`${LABEL} mb-2`} style={LABEL_STYLE}>{tHome("businessHours")}</div>
                <p className="font-body text-[14px] text-white/70">{tHome("businessHoursValue")}</p>
                <a
                  href="https://maps.app.goo.gl/FmmMz14kUWkGk1HcA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LABEL} mt-8 inline-flex items-center gap-2 transition-opacity hover:opacity-70`}
                  style={{ color: BLUE }}
                >
                  {t("openInMaps")}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
              <div className="h-72 flex-1 md:h-auto">
                <iframe
                  src="https://maps.google.com/maps?q=35.0089697,137.0262555&hl=en&z=16&output=embed"
                  width="100%" height="100%"
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)", minHeight: "320px" }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
