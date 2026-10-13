"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import Reveal from "@/components/Reveal";

type Vehicle = any;

interface VehiclesClientProps {
  initialVehicles: Vehicle[];
  makes: string[];
  locale: string;
}

/* Status priority: available first, reserved second, sold last */
const STATUS_ORDER: Record<string, number> = { available: 0, reserved: 1, sold: 2 };

/* ── Shared visual language, borrowed from the home page and contact form ──
   Near-black stage, Clash Display for headings and meta, DM Sans for copy,
   and blue reserved for accents: a filter's active dot, the range it covers,
   and the hairline that draws under a card on hover.                      */

const BLACK = "#0a0a0a";
const BLUE = "#2D7FF9";

/** Small uppercase tracked labels — the contact form's treatment. */
const LABEL = "mm-meta text-[11px] uppercase tracking-[0.22em]";
const LABEL_STYLE = { color: "rgba(255,255,255,0.35)" } as const;

/** Borderless, bottom-line-only fields — also the contact form's. */
const FIELD =
  "font-body w-full border-b bg-transparent px-0 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none dark:[color-scheme:dark]";
const FIELD_STYLE = { borderColor: "rgba(255,255,255,0.12)", borderRadius: 0 } as const;

/** A plain text toggle: white with a blue dot when on, grey when off. The dot
 *  keeps its space either way, so nothing shifts. */
function FilterToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 py-[7px] text-left"
    >
      <span
        aria-hidden="true"
        className={`h-[5px] w-[5px] shrink-0 transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: BLUE }}
      />
      <span
        className={`font-body text-[13px] transition-colors duration-200 ${
          active ? "text-white" : "text-white/40 group-hover:text-white/70"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function VehiclesClient({ initialVehicles, makes, locale }: VehiclesClientProps) {
  const t = useTranslations("VehiclesPage");
  const tLabels = useTranslations("VehicleLabels");

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  const maxDbPrice = useMemo(() => {
    return initialVehicles.reduce((max, v) => Math.max(max, v.priceJpy), 5000000);
  }, [initialVehicles]);

  const minDbPrice = 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([minDbPrice, maxDbPrice]);
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [makesExpanded, setMakesExpanded] = useState(false);

  /* Accordion state for collapsible sidebar sections */
  const [makesOpen, setMakesOpen] = useState(true);
  const [yearOpen, setYearOpen] = useState(false);

  const clearFilters = () => {
    setCategories([]);
    setSelectedMakes([]);
    setPriceRange([minDbPrice, maxDbPrice]);
    setMinYear("");
    setMaxYear("");
    setSearchQuery("");
  };

  const removeFilter = (type: string, value?: string) => {
    if (type === "category" && value) setCategories(prev => prev.filter(c => c !== value));
    if (type === "make" && value) setSelectedMakes(prev => prev.filter(m => m !== value));
    if (type === "price") setPriceRange([minDbPrice, maxDbPrice]);
    if (type === "year") { setMinYear(""); setMaxYear(""); }
    if (type === "search") setSearchQuery("");
  };

  const hasActiveFilters = categories.length > 0 || selectedMakes.length > 0 || searchQuery || minYear || maxYear || priceRange[0] > minDbPrice || priceRange[1] < maxDbPrice;

  const filteredVehicles = useMemo(() => {
    return initialVehicles.filter(v => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const text = `${v.make} ${v.model} ${v.year}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      if (categories.length > 0 && !categories.includes(v.category)) return false;
      if (selectedMakes.length > 0 && !selectedMakes.includes(v.make)) return false;
      if (v.priceJpy < priceRange[0] || v.priceJpy > priceRange[1]) return false;
      if (minYear && v.year < parseInt(minYear)) return false;
      if (maxYear && v.year > parseInt(maxYear)) return false;
      return true;
    }).sort((a, b) => {
      /* Primary sort: status (available → reserved → sold) */
      const statusA = STATUS_ORDER[a.status] ?? 9;
      const statusB = STATUS_ORDER[b.status] ?? 9;
      if (statusA !== statusB) return statusA - statusB;

      /* Secondary sort: user-selected option */
      if (sortOption === "price-asc") return a.priceJpy - b.priceJpy;
      if (sortOption === "price-desc") return b.priceJpy - a.priceJpy;
      if (sortOption === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [initialVehicles, searchQuery, categories, selectedMakes, priceRange, minYear, maxYear, sortOption]);

  const visibleMakes = makesExpanded ? makes : makes.slice(0, 5);

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

  /* ─── Shared filter panel content ─── */
  const filterContent = (
    <div className="flex flex-col gap-9">
      {/* ── Categories (always visible) ── */}
      <div>
        <h3 className={`${LABEL} mb-3`} style={LABEL_STYLE}>{t("category")}</h3>
        <div className="flex flex-col">
          {["CAR", "SUV", "TRUCK", "VAN", "MOTORCYCLE", "MACHINERY"].map(cat => (
            <FilterToggle
              key={cat}
              label={tLabels(`category.${cat}`)}
              active={categories.includes(cat)}
              onClick={() => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
            />
          ))}
        </div>
      </div>

      {/* ── Make / Brand (collapsible) ── */}
      <div>
        <button
          onClick={() => setMakesOpen(!makesOpen)}
          className="flex w-full items-center justify-between"
        >
          <h3 className={LABEL} style={LABEL_STYLE}>{t("makeBrand")}</h3>
          <ChevronDown size={13} className={`text-white/25 transition-transform duration-200 ${makesOpen ? 'rotate-180' : ''}`} />
        </button>
        {makesOpen && (
          <div className="mt-3 flex flex-col">
            {visibleMakes.map(make => (
              <FilterToggle
                key={make}
                label={make}
                active={selectedMakes.includes(make)}
                onClick={() => setSelectedMakes(prev => prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make])}
              />
            ))}
            {makes.length > 5 && (
              <button
                onClick={() => setMakesExpanded(!makesExpanded)}
                className="mt-2 pl-[15px] text-left text-[11px] uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
                style={{ color: BLUE }}
              >
                {makesExpanded ? t("showLess") : t("showMore", { count: makes.length - 5 })}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Price Range (always visible) ── */}
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className={LABEL} style={LABEL_STYLE}>{t("price")}</h3>
          <span className="font-body text-[11px] text-white/35">
            {priceFormatter.format(priceRange[0])} — {priceFormatter.format(priceRange[1])}
          </span>
        </div>
        <div className="relative flex h-6 w-full items-center">
          <div className="absolute h-px w-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          <div
            className="pointer-events-none absolute h-px"
            style={{
              background: BLUE,
              left: `${(priceRange[0] / maxDbPrice) * 100}%`,
              right: `${100 - (priceRange[1] / maxDbPrice) * 100}%`,
            }}
          />
          <input
            type="range" min={minDbPrice} max={maxDbPrice} step={50000}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), priceRange[1] - 50000);
              setPriceRange([val, priceRange[1]]);
            }}
            className="mm-range-line" style={{ zIndex: 3 }}
          />
          <input
            type="range" min={minDbPrice} max={maxDbPrice} step={50000}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), priceRange[0] + 50000);
              setPriceRange([priceRange[0], val]);
            }}
            className="mm-range-line" style={{ zIndex: 4 }}
          />
        </div>
      </div>

      {/* ── Year (collapsible) ── */}
      <div>
        <button
          onClick={() => setYearOpen(!yearOpen)}
          className="flex w-full items-center justify-between"
        >
          <h3 className={LABEL} style={LABEL_STYLE}>{t("year")}</h3>
          <ChevronDown size={13} className={`text-white/25 transition-transform duration-200 ${yearOpen ? 'rotate-180' : ''}`} />
        </button>
        {yearOpen && (
          <div className="mt-3 flex items-center gap-4">
            <input type="number" placeholder={t("min")} value={minYear} onChange={e => setMinYear(e.target.value)} className={`${FIELD} !py-1.5 !text-[13px]`} style={FIELD_STYLE} />
            <span className="text-[11px] text-white/25">—</span>
            <input type="number" placeholder={t("max")} value={maxYear} onChange={e => setMaxYear(e.target.value)} className={`${FIELD} !py-1.5 !text-[13px]`} style={FIELD_STYLE} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="-mt-[88px] w-full pt-[88px]" style={{ background: BLACK, minHeight: "100dvh" }}>
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-20 md:pt-28 lg:px-8">

        {/* ═══════════════════════════════════════════
            Page heading
            ═══════════════════════════════════════════ */}
        <Reveal as="header" className="mb-14 flex items-end justify-between gap-6 md:mb-20">
          <h1
            className="font-heading font-medium text-white text-[clamp(2.25rem,5vw,4rem)]"
            style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            {t("title")}
          </h1>

          {/* Mobile filter trigger (visible < md) */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className={`${LABEL} flex shrink-0 items-center gap-2 border-b pb-2 text-white/70 transition-colors hover:text-white md:hidden`}
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            <Filter size={13} />
            {t("filters")}
            {hasActiveFilters && (
              <span style={{ color: BLUE }}>
                {categories.length + selectedMakes.length + (minYear || maxYear ? 1 : 0) + (priceRange[0] > minDbPrice || priceRange[1] < maxDbPrice ? 1 : 0)}
              </span>
            )}
          </button>
        </Reveal>

        <div className="flex flex-col gap-14 md:flex-row md:gap-16">

          {/* ═══════════════════════════════════════════
              Desktop sidebar (visible >= md) — no box
              ═══════════════════════════════════════════ */}
          <aside className="hidden shrink-0 md:block md:w-[200px] lg:w-[220px]">
            <Reveal className="sticky top-[120px]">
              <div className="mb-8 flex items-baseline justify-between gap-3">
                <h2 className={LABEL} style={{ color: "rgba(255,255,255,0.7)" }}>{t("filters")}</h2>
                <button
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
                >
                  {t("reset")}
                </button>
              </div>
              {filterContent}
            </Reveal>
          </aside>

          {/* ═══════════════════════════════════════════
              Main content area
              ═══════════════════════════════════════════ */}
          <main className="flex min-w-0 flex-1 flex-col gap-10">

            {/* ── Search / Sort bar — bottom lines only, no panel ── */}
            <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                <input
                  type="text"
                  placeholder={t("findPlaceholder")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`${FIELD} !pl-7`}
                  style={FIELD_STYLE}
                />
              </div>

              <div className="flex items-end justify-between gap-8 sm:justify-end">
                <span className={`${LABEL} whitespace-nowrap pb-2.5`} style={LABEL_STYLE}>
                  {t("vehiclesFound", { count: filteredVehicles.length })}
                </span>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                    className={`${FIELD} !w-auto cursor-pointer appearance-none pr-6`}
                    style={FIELD_STYLE}
                  >
                    <option value="newest" style={{ background: BLACK }}>{t("sortNewest")}</option>
                    <option value="recommended" style={{ background: BLACK }}>{t("sortRecommended")}</option>
                    <option value="price-asc" style={{ background: BLACK }}>{t("sortPriceAsc")}</option>
                    <option value="price-desc" style={{ background: BLACK }}>{t("sortPriceDesc")}</option>
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>
            </Reveal>

            {/* ── Active filters — plain text, no pills ── */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {searchQuery && (
                  <span className="mm-filter-text">
                    &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => removeFilter("search")} className="ml-1.5 text-white/30 transition-colors hover:text-white"><X size={11} /></button>
                  </span>
                )}
                {categories.map(cat => (
                  <span key={cat} className="mm-filter-text">
                    {tLabels(`category.${cat}`)}
                    <button onClick={() => removeFilter("category", cat)} className="ml-1.5 text-white/30 transition-colors hover:text-white"><X size={11} /></button>
                  </span>
                ))}
                {selectedMakes.map(make => (
                  <span key={make} className="mm-filter-text">
                    {make}
                    <button onClick={() => removeFilter("make", make)} className="ml-1.5 text-white/30 transition-colors hover:text-white"><X size={11} /></button>
                  </span>
                ))}
                {(priceRange[0] > minDbPrice || priceRange[1] < maxDbPrice) && (
                  <span className="mm-filter-text">
                    {priceFormatter.format(priceRange[0])} — {priceFormatter.format(priceRange[1])}
                    <button onClick={() => removeFilter("price")} className="ml-1.5 text-white/30 transition-colors hover:text-white"><X size={11} /></button>
                  </span>
                )}
                {(minYear || maxYear) && (
                  <span className="mm-filter-text">
                    {minYear || t("any")} — {maxYear || t("any")}
                    <button onClick={() => removeFilter("year")} className="ml-1.5 text-white/30 transition-colors hover:text-white"><X size={11} /></button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
                >
                  {t("clearAll")}
                </button>
              </div>
            )}

            {/* ── Card Grid ── */}
            {filteredVehicles.length === 0 ? (
              <div className="py-32 text-center">
                <p className="font-body text-sm text-white/35">{t("empty") || t("emptyFallback")}</p>
                <button
                  onClick={clearFilters}
                  className="mt-5 text-[11px] uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
                  style={{ color: BLUE }}
                >
                  {t("clearAllFilters")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle: any, i: number) => (
                  <Reveal key={vehicle.id} delay={Math.min(i * 50, 400)} className="h-full">
                    <Link href={`/vehicles/${vehicle.slug}`} className="group flex h-full flex-col">

                      {/* Hard-edged image, title sitting on its own scrim */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {vehicle.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={vehicle.images[0].url}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/15">{t("noImage")}</div>
                        )}

                        {/* The scrim the title reads against — same treatment as
                            the Location and Sell sections. */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-3/5"
                          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 42%, transparent 100%)" }}
                        />

                        {/* Status is only worth saying when it is not available. */}
                        {vehicle.status !== "available" && (
                          <span className={`${LABEL} absolute left-5 top-5 text-white/70`}>
                            {statusLabels[vehicle.status] ?? vehicle.status}
                          </span>
                        )}

                        <h2 className="absolute inset-x-0 bottom-0 line-clamp-1 px-5 pb-4 font-heading text-[1.0625rem] font-medium leading-snug text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h2>

                        {/* The one piece of blue on a card: a hairline drawn in
                            under it on hover. */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                          style={{ background: BLUE }}
                        />
                      </div>

                      <p className="font-body mt-4 line-clamp-1 text-[12px] text-white/40">
                        {vehicle.mileageKm.toLocaleString()} km • {transmissionLabels[vehicle.transmission] ?? vehicle.transmission} • {fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}
                      </p>

                      <div className="mt-2.5 flex items-baseline justify-between gap-4">
                        <p className="mm-meta text-[1.15rem] tracking-tight text-white">
                          {priceFormatter.format(vehicle.priceJpy)}
                        </p>
                        <span
                          className="-translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                          style={{ color: BLUE }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Mobile filter drawer (slide-over)
          ═══════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 md:hidden ${showMobileFilters ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setShowMobileFilters(false)}
      />
      <div
        className={`fixed bottom-0 left-0 top-0 z-50 w-[320px] max-w-[85vw] overflow-y-auto transition-transform duration-300 ease-out md:hidden ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: BLACK }}
      >
        <div className="px-6 py-8">
          <div className="mb-10 flex items-center justify-between">
            <h2 className={LABEL} style={{ color: "rgba(255,255,255,0.7)" }}>{t("filters")}</h2>
            <div className="flex items-center gap-5">
              <button onClick={clearFilters} className="text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white">{t("reset")}</button>
              <button className="text-white/40 transition-colors hover:text-white" onClick={() => setShowMobileFilters(false)}>
                <X size={18} />
              </button>
            </div>
          </div>
          {filterContent}
          <button
            className="mm-meta mt-12 w-full py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-90"
            style={{ background: BLUE, borderRadius: 0 }}
            onClick={() => setShowMobileFilters(false)}
          >
            {t("applyFilters")}
          </button>
        </div>
      </div>
    </div>
  );
}
