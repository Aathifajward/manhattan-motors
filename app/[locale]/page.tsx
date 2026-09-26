import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { createInquiry } from "@/lib/actions/inquiry";
import HeroScroll from "@/components/HeroScroll";
import { Car, Truck, Bus, Tractor, Bike } from "lucide-react";
import FadeInSection from "@/components/FadeInSection";
import { MotionCard, MotionLink, MotionExternalLink, MotionButton } from "@/components/MotionElements";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  const t = await getTranslations("HomePage");

  let featuredVehicles: any[] = [];
  try {
    const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (retries > 0) {
          console.warn(`Database connection failed, retrying... (${retries} left)`);
          await new Promise((r) => setTimeout(r, 1500));
          return fetchWithRetry(fn, retries - 1);
        }
        throw err;
      }
    };
    featuredVehicles = await fetchWithRetry(() =>
      prisma.vehicle.findMany({
        where: { status: "available" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { images: { where: { isCover: true }, take: 1 } },
      })
    );
  } catch (error) {
    console.error("Failed to fetch featured vehicles:", error);
  }

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  const cardWidths = ["sm:w-[420px]", "sm:w-[340px]", "sm:w-[380px]", "sm:w-[450px]", "sm:w-[360px]", "sm:w-[400px]"];
  const cardRatios = ["16/10", "4/5", "4/3", "16/10", "4/3", "4/5"];

  const BLUE = "#2D7FF9";
  const BLUE_DIM = "rgba(45,127,249,0.15)";
  const BLUE_GLOW = "rgba(45,127,249,0.35)";

  return (
    <div className="flex flex-1 flex-col -mt-[88px]">

      {/* 1. Hero — frame sequence */}
      <HeroScroll
        title={t("title")}
        subtitle={t("subtitle")}
        browseVehicles={t("browseVehicles")}
        contactUs={t("contactUs")}
      />

      {/* Blue accent divider */}
      <div style={{ height: "1px", background: `linear-gradient(to right, transparent, ${BLUE_GLOW}, transparent)` }} />

      {/* 2. How We Work — navy, glassmorphic step cards */}
      <section className="w-full py-28 relative overflow-hidden">
        {/* Subtle glow blob top-right */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(45,127,249,0.06) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="mb-16">
            <span className="mm-label mb-4 block">{t("howWeWorkLabel")}</span>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("howWeWork")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: t("serviceExport"), desc: t("serviceExportDesc") },
              { step: "02", title: t("serviceDoc"), desc: t("serviceDocDesc") },
              { step: "03", title: t("servicePricing"), desc: t("servicePricingDesc") },
              { step: "04", title: t("serviceShipping"), desc: t("serviceShippingDesc") },
            ].map((s, idx) => (
              <FadeInSection key={s.step} delay={idx * 0.1}>
                <div className="mm-glass-card group flex flex-col p-7 h-full">
                  <span
                  className="mb-5 block font-mono text-5xl font-black leading-none transition-colors duration-300"
                  style={{ color: BLUE_DIM }}
                >
                  {s.step}
                </span>
                <h3 className="mb-3 text-base font-bold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                <div className="mt-auto pt-6">
                  <div
                    className="h-px w-0 transition-all duration-500 group-hover:w-full"
                    style={{ background: BLUE }}
                  />
                </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Blue accent divider */}
      <div style={{ height: "1px", background: `linear-gradient(to right, transparent, ${BLUE_GLOW}, transparent)` }} />

      {/* 3. What We Deal In — dark navy */}
      <section className="w-full py-28 relative overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 relative">
          <div className="mb-14">
            <span className="mm-label mb-4 block">{t("stockLabel")}</span>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("categories")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { title: t("catCars"), link: "/vehicles?category=CAR", icon: <Car size={40} strokeWidth={1.5} /> },
              { title: t("catTrucks"), link: "/vehicles?category=TRUCK", icon: <Truck size={40} strokeWidth={1.5} /> },
              { title: t("catVans"), link: "/vehicles?category=VAN", icon: <Bus size={40} strokeWidth={1.5} /> },
              { title: t("catMachinery"), link: "/vehicles?category=MACHINERY", icon: <Tractor size={40} strokeWidth={1.5} /> },
              { title: t("catMotorcycles"), link: "/vehicles?category=MOTORCYCLE", icon: <Bike size={40} strokeWidth={1.5} /> },
            ].map((cat, idx) => (
              <FadeInSection key={cat.title} delay={idx * 0.1}>
                <MotionLink
                  href={cat.link}
                  className="mm-glass-card group flex flex-col items-center justify-center p-8 transition-all duration-300 w-full"
                  fullWidth={true}
                >
                <div className="mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-white text-center uppercase tracking-widest">{cat.title}</h3>
              </MotionLink>
              </FadeInSection>
            ))}
          </div>
          {/* Fade edge */}
          <div className="absolute right-0 top-0 bottom-6 w-16 pointer-events-none" style={{ background: `linear-gradient(to left, #0A0E14, transparent)` }} />
        </div>
      </section>

      {/* 4. Available Now — navy, horizontal carousel */}
      {featuredVehicles.length > 0 && (
        <section className="w-full py-28 relative overflow-hidden">
          {/* Ambient glow blob */}
          <div className="absolute bottom-0 left-1/2 w-[600px] h-64 pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(45,127,249,0.06) 0%, transparent 70%)", transform: "translateX(-50%)" }} />
          <div className="mx-auto w-full max-w-7xl relative">
            <div className="mb-14 flex flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-end">
              <div>
                <span className="mm-label mb-4 block">Stock</span>
                <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("featured")}</h2>
              </div>
              <Link href="/vehicles" className="group flex items-center gap-2 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                <span className="group-hover:text-white transition-colors">{t("viewAll")}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: BLUE }}>&#8594;</span>
              </Link>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-8 px-6 hide-scrollbar items-start">
              {featuredVehicles.map((vehicle, i) => {
                const isLarge = i % 3 === 0;
                return (
                  <MotionCard
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.slug}`} 
                    className={`snap-start shrink-0 group block w-[80vw] ${cardWidths[i] ?? "sm:w-[380px]"}`}
                    delay={i * 0.05}
                  >
                    <div
                      className={`mm-glass-card flex flex-col overflow-hidden h-full ${isLarge ? "mm-card-large" : "mm-card-small"}`}
                    >
                      {vehicle.images[0] ? (
                        <div className="relative overflow-hidden" style={{ aspectRatio: cardRatios[i] ?? "4/3" }}>
                          <img
                            src={vehicle.images[0].url}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {/* Dark gradient + blue tint overlay */}
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,14,20,0.88) 0%, rgba(10,14,20,0.1) 45%, transparent 100%)" }} />
                          {/* Available badge */}
                          <div className="absolute top-4 left-4 px-2 py-0.5 text-xs font-bold uppercase tracking-widest" style={{ border: `1px solid ${BLUE}`, color: BLUE, borderRadius: "4px", background: BLUE_DIM }}>
                            Available
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-xs" style={{ aspectRatio: "4/3", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.15)" }}>
                          No image
                        </div>
                      )}
                      <div className="flex flex-col p-6 gap-2">
                        <h3 className="text-base font-bold leading-snug text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                        <p className="text-xl font-black tracking-tight" style={{ color: BLUE }}>{priceFormatter.format(vehicle.priceJpy)}</p>
                        {(vehicle.mileage || vehicle.transmission) && (
                          <div className="flex gap-4 pt-1">
                            {vehicle.mileage != null && <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{vehicle.mileage.toLocaleString()} km</span>}
                            {vehicle.transmission && <span className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{vehicle.transmission}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </MotionCard>
                );
              })}
            </div>
            <div className="absolute right-0 top-0 bottom-8 w-24 pointer-events-none" style={{ background: `linear-gradient(to left, #0A0E14, transparent)` }} />
          </div>
        </section>
      )}

      {/* Blue accent divider */}
      <div style={{ height: "1px", background: `linear-gradient(to right, transparent, ${BLUE_GLOW}, transparent)` }} />

      {/* 5. Location — dark navy */}
      <section className="w-full py-28 relative overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6">
          <FadeInSection className="mb-14">
            <span className="mm-label mb-4 block">Based in Japan</span>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("location")}</h2>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{t("visitOffice")}</p>
          </FadeInSection>
          <FadeInSection delay={0.2} className="overflow-hidden" style={{ borderRadius: "6px 20px 6px 6px", background: "rgba(10,14,20,0.92)", border: "1px solid rgba(45,127,249,0.18)", boxShadow: "0 8px 40px rgba(0,0,0,0.35)" }}>
            <div className="flex flex-col md:flex-row">
              <div className="flex flex-col justify-center p-10 md:w-80 shrink-0">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>{t("addressLabel")}</div>
                <p className="mb-8 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>3-12-5 Hitotsugi-cho<br />Kariya City, Aichi 448-0003<br />Japan</p>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>{t("businessHours")}</div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{t("businessHoursValue")}</p>
                <a href="https://maps.app.goo.gl/FmmMz14kUWkGk1HcA" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D7FF9] hover:text-white transition-colors">
                  Open in Maps
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
              <div className="flex-1 h-72 md:h-auto">
                <iframe
                  src="https://maps.google.com/maps?q=35.0089697,137.0262555&hl=en&z=16&output=embed"
                  width="100%" height="100%"
                  style={{ border: 0, minHeight: "280px", filter: "invert(90%) hue-rotate(180deg)" }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 6. CTA Banner — navy with electric blue button */}
      <section
        className="w-full py-28 relative overflow-hidden"
        style={{ borderTop: `1px solid rgba(45,127,249,0.15)` }}
      >
        {/* Centered glow blob behind CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: "500px", height: "300px", background: "radial-gradient(ellipse, rgba(45,127,249,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
        </div>
        <FadeInSection className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <span className="mm-label mb-6 inline-block">Ready?</span>
          <h2 className="mb-10 text-4xl font-black tracking-tight text-white sm:text-5xl leading-tight">{t("sellBannerTitle")}</h2>
          <MotionExternalLink
            href="#contact"
            className="inline-flex items-center gap-2 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: BLUE, borderRadius: "6px", boxShadow: `0 0 32px ${BLUE_GLOW}, 0 4px 16px rgba(0,0,0,0.4)` }}
          >
            {t("contactUsNow")}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </MotionExternalLink>
        </FadeInSection>
      </section>

      {/* 7. Contact — dark navy */}
      <section id="contact" className="w-full py-28 relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-16 lg:grid-cols-2">
            <FadeInSection>
              <span className="mm-label mb-4 block">Reach Us</span>
              <h2 className="mb-10 text-4xl font-bold tracking-tight text-white sm:text-5xl">{t("contactUs")}</h2>
              <div
                className="flex flex-col gap-8 p-8"
                style={{ background: "rgba(10,14,20,0.92)", border: "1px solid rgba(45,127,249,0.18)", borderRadius: "6px 20px 6px 6px", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}
              >
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>LINE</p>
                  <MotionExternalLink href="https://line.me/ti/p/~Maz615" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white hover:opacity-80 transition-opacity" style={{ background: "#06C755", borderRadius: "4px", display: "inline-flex" }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.905 8.91 9.489 9.613.393.076.924.232 1.062.535.125.275.081.71.039.998l-.206 1.258c-.063.385-.297 1.455 1.272.793 1.57-.661 8.468-4.992 10.73-7.925 1.092-1.42 1.614-2.81 1.614-4.272z" /></svg>
                    Maz615
                  </MotionExternalLink>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>Phone</p>
                  <a href="tel:090-3959-3883" className="text-xl font-bold text-white hover:opacity-70 transition-opacity">090-3959-3883</a>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>Email</p>
                  <a href="mailto:manhattanmotors.726@gmail.com" className="text-base font-bold text-white hover:opacity-70 transition-opacity break-all">manhattanmotors.726@gmail.com</a>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection
              delay={0.2}
              className="p-8"
              style={{ background: "rgba(10,14,20,0.92)", border: "1px solid rgba(45,127,249,0.18)", borderRadius: "20px 6px 6px 6px", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}
            >
              {sent === "true" && (
                <div className="mb-6 p-4 text-sm font-semibold" style={{ background: BLUE_DIM, border: `1px solid rgba(45,127,249,0.4)`, color: BLUE, borderRadius: "4px" }}>
                  Thank you — your inquiry has been sent.
                </div>
              )}
              <form action={createInquiry} className="flex flex-col gap-5">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="slug" value="" />
                <input type="hidden" name="vehicleId" value="" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{t("formName")}</label>
                    <input name="name" required className="border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{t("formEmail")}</label>
                    <input name="email" type="email" required className="border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 }} />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{t("formPhone")}</label>
                    <input name="phone" className="border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{t("formVehicleType")}</label>
                    <select name="preferredContact" required className="border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0, background: "rgba(10,14,20,0.92)" }}>
                      <option value="Any">Any / General Inquiry</option>
                      <option value="Car">Passenger Car</option>
                      <option value="Truck/Van">Truck / Van</option>
                      <option value="Machinery">Machinery / Parts</option>
                      <option value="Motorcycle">Motorcycle</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{t("formMessage")}</label>
                  <textarea name="message" required rows={4} className="border-b bg-transparent px-0 py-2.5 text-sm text-white focus:outline-none resize-none" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 }} />
                </div>
                <MotionButton
                  type="submit"
                  className="mt-2 w-full py-4 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
                  style={{ background: BLUE, borderRadius: "6px", boxShadow: `0 0 20px rgba(45,127,249,0.25)` }}
                >
                  {t("formSubmit")}
                </MotionButton>
              </form>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  );
}