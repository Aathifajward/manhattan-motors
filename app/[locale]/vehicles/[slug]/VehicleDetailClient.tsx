"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import FadeInSection from "@/components/FadeInSection";
import { MotionLink, MotionExternalLink, MotionButton } from "@/components/MotionElements";

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

  let badgeBg = 'rgba(255,255,255,0.06)';
  let badgeColor = 'rgba(255,255,255,0.5)';
  let badgeBorder = 'rgba(255,255,255,0.1)';
  if (vehicle.status === "available") {
    badgeBg = 'rgba(34,197,94,0.1)';
    badgeColor = '#4ADE80';
    badgeBorder = 'rgba(34,197,94,0.25)';
  } else if (vehicle.status === "sold") {
    badgeBg = 'rgba(239,68,68,0.1)';
    badgeColor = '#F87171';
    badgeBorder = 'rgba(239,68,68,0.25)';
  } else if (vehicle.status === "reserved") {
    badgeBg = 'rgba(234,179,8,0.1)';
    badgeColor = '#FACC15';
    badgeBorder = 'rgba(234,179,8,0.25)';
  }

  const BLUE = "#2D7FF9";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 flex flex-col gap-12">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
        <Link href="/" className="hover:text-white transition-colors">{t("home")}</Link>
        <span>/</span>
        <Link href="/vehicles" className="hover:text-white transition-colors">{t("vehicles")}</Link>
        <span>/</span>
        <span className="text-white">{vehicle.make} {vehicle.model}</span>
      </nav>

      {/* ── Top Section: 2 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-8 lg:gap-12 w-full">
        {/* ── Left Column: Gallery ── */}
        <FadeInSection className="flex flex-col gap-4 w-full">
          <div className="mm-glass-card relative overflow-hidden aspect-[4/3] w-full" style={{ borderRadius: '16px', background: 'rgba(20,24,32,0.4)' }}>
            {mainImage ? (
              <img src={mainImage} alt={`${vehicle.make} ${vehicle.model}`} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>No image</div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-2 w-full">
              {images.map((img: any, idx: number) => {
                const isActive = idx === activeImageIdx;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIdx(idx)}
                    className="relative shrink-0 snap-start overflow-hidden mm-glass-card transition-all duration-300"
                    style={{
                      width: '100px',
                      height: '75px',
                      borderRadius: '8px',
                      borderColor: isActive ? 'rgba(45,127,249,0.5)' : 'rgba(255,255,255,0.1)',
                      boxShadow: isActive ? '0 0 12px rgba(45,127,249,0.2)' : 'none',
                    }}
                  >
                    <img src={img.url} alt="thumbnail" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: isActive ? 1 : 0.6 }} />
                  </button>
                );
              })}
            </div>
          )}
        </FadeInSection>

        {/* ── Right Column: Info + Overview ── */}
        <div className="flex flex-col">
          <FadeInSection delay={0.1}>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex flex-wrap gap-2 items-center mb-8">
              <span className="mm-filter-chip !bg-[rgba(255,255,255,0.04)] !border-[rgba(255,255,255,0.1)] !text-[rgba(255,255,255,0.7)]">{tLabels(`category.${vehicle.category}`)}</span>
              <span className="mm-filter-chip !bg-[rgba(255,255,255,0.04)] !border-[rgba(255,255,255,0.1)] !text-[rgba(255,255,255,0.7)]">{vehicle.year}</span>
              {vehicle.transmission && (
                <span className="mm-filter-chip !bg-[rgba(255,255,255,0.04)] !border-[rgba(255,255,255,0.1)] !text-[rgba(255,255,255,0.7)]">{transmissionLabels[vehicle.transmission] ?? vehicle.transmission}</span>
              )}
              <span 
                className="mm-filter-chip"
                style={{
                  background: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                }}
              >
                {statusLabels[vehicle.status] ?? vehicle.status}
              </span>
            </div>
            
            <p className="text-4xl sm:text-5xl font-black tracking-tight mb-6" style={{ color: BLUE }}>
              {priceFormatter.format(vehicle.priceJpy)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <MotionLink
                href="/#contact"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px'
                }}
                fullWidth={true}
              >
                {t("contactUs")}
              </MotionLink>
              <MotionExternalLink
                href="https://line.me/ti/p/~Maz615"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: BLUE, borderRadius: '10px', boxShadow: `0 0 20px rgba(45,127,249,0.25)` }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: '#06C755' }}><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" /></svg>
                {t("messageLine")}
              </MotionExternalLink>
              <MotionButton 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url: window.location.href });
                  }
                }}
                className="flex items-center justify-center w-14 rounded-[10px] transition-all duration-200 shrink-0"
                style={{
                  background: 'rgba(10,14,20,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <Share2 size={18} />
              </MotionButton>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <section>
              <h2 className="mb-6 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{t("overview")}</h2>
              <div className="mm-glass-card p-6 grid grid-cols-2 gap-x-6 gap-y-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("status")}</dt>
                    <dd className="text-sm font-semibold mt-1" style={{ color: badgeColor }}>{statusLabels[vehicle.status] ?? vehicle.status}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("year")}</dt>
                    <dd className="text-sm font-semibold text-white mt-1">{vehicle.year}</dd>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {vehicle.transmission && (
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("transmission")}</dt>
                      <dd className="text-sm font-semibold text-white mt-1">{transmissionLabels[vehicle.transmission] ?? vehicle.transmission}</dd>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("category")}</dt>
                    <dd className="text-sm font-semibold text-white mt-1">{tLabels(`category.${vehicle.category}`)}</dd>
                  </div>
                </div>
                
                {vehicle.mileageKm != null && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("mileage")}</dt>
                      <dd className="text-sm font-semibold text-white mt-1">{vehicle.mileageKm.toLocaleString()} km</dd>
                    </div>
                  </div>
                )}
                {vehicle.fuelType && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("fuelType")}</dt>
                      <dd className="text-sm font-semibold text-white mt-1">{fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}</dd>
                    </div>
                  </div>
                )}
                {vehicle.color && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("color")}</dt>
                      <dd className="text-sm font-semibold text-white mt-1">{vehicle.color}</dd>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>{t("price")}</dt>
                    <dd className="text-sm font-semibold mt-1" style={{ color: BLUE }}>{priceFormatter.format(vehicle.priceJpy)}</dd>
                  </div>
                </div>
              </div>
            </section>
          </FadeInSection>
        </div>
      </div>

      {/* ── Bottom Section: Description, Location ── */}
      {description && (
        <FadeInSection>
          <section>
            <h2 className="mb-6 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{t("description")}</h2>
            {showFallbackNote && (
              <p className="mb-3 text-xs italic" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {t("descriptionFallbackNote")}
              </p>
            )}
            <div className="mm-glass-card p-6 sm:p-8">
              <div className="whitespace-pre-line text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {description}
              </div>
            </div>
          </section>
        </FadeInSection>
      )}

      <FadeInSection>
        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{t("location")}</h2>
          <div className="mm-glass-card overflow-hidden" style={{ borderRadius: "20px 6px 20px 6px" }}>
            <div className="flex flex-col md:flex-row">
              <div className="flex flex-col justify-center p-8 md:w-80 shrink-0" style={{ background: 'rgba(10,14,20,0.6)' }}>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: BLUE }}>{tHome("addressLabel")}</div>
                <p className="mb-8 text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>3-12-5 Hitotsugi-cho<br />Kariya City, Aichi<br />448-0003 Japan</p>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: BLUE }}>{tHome("businessHours")}</div>
                <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.65)" }}>{tHome("businessHoursValue")}</p>
                <a href="https://maps.app.goo.gl/FmmMz14kUWkGk1HcA" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D7FF9] hover:text-white transition-colors">
                  Open in Maps
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
              <div className="flex-1 h-72 md:h-auto border-l border-white/10 md:border-t-0 border-t">
                <iframe
                  src="https://maps.google.com/maps?q=35.0089697,137.0262555&hl=en&z=16&output=embed"
                  width="100%" height="100%"
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)", minHeight: "280px" }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}
