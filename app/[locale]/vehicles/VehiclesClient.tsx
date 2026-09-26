"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Search, Filter, X, Bookmark, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import FadeInSection from "@/components/FadeInSection";

type Vehicle = any;

interface VehiclesClientProps {
  initialVehicles: Vehicle[];
  makes: string[];
  locale: string;
}

/* Status priority: available first, reserved second, sold last */
const STATUS_ORDER: Record<string, number> = { available: 0, reserved: 1, sold: 2 };

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
    <div className="flex flex-col gap-5">
      {/* ── Categories (always visible) ── */}
      <div>
        <h3 className="text-[11px] font-bold text-[#2D7FF9] mb-2.5 uppercase tracking-[0.2em]">Category</h3>
        <div className="flex flex-col gap-0.5">
          {["CAR", "TRUCK", "VAN", "MOTORCYCLE", "MACHINERY"].map(cat => {
            const isActive = categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                className="flex items-center gap-2.5 w-full px-2 py-[7px] rounded-md cursor-pointer group transition-colors duration-200 hover:bg-white/[0.04]"
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 shrink-0"
                  style={{
                    background: isActive ? '#2D7FF9' : 'rgba(255,255,255,0.04)',
                    border: isActive ? '1px solid #2D7FF9' : '1px solid rgba(255,255,255,0.12)',
                    boxShadow: isActive ? '0 0 8px rgba(45,127,249,0.3)' : 'none',
                  }}
                >
                  {isActive && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-[12px] font-medium text-zinc-300 group-hover:text-white transition-colors">{tLabels(`category.${cat}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(45,127,249,0.12), transparent)' }} />

      {/* ── Make / Brand (collapsible) ── */}
      <div>
        <button
          onClick={() => setMakesOpen(!makesOpen)}
          className="flex items-center justify-between w-full group"
        >
          <h3 className="text-[11px] font-bold text-[#2D7FF9] uppercase tracking-[0.2em]">Make / Brand</h3>
          <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${makesOpen ? 'rotate-180' : ''}`} />
        </button>
        {makesOpen && (
          <div className="mt-2 flex flex-col gap-0.5">
            {visibleMakes.map(make => {
              const isActive = selectedMakes.includes(make);
              return (
                <button
                  key={make}
                  onClick={() => setSelectedMakes(prev => prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make])}
                  className="flex items-center gap-2.5 w-full px-2 py-[7px] rounded-md cursor-pointer group transition-colors duration-200 hover:bg-white/[0.04]"
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 shrink-0"
                    style={{
                      background: isActive ? '#2D7FF9' : 'rgba(255,255,255,0.04)',
                      border: isActive ? '1px solid #2D7FF9' : '1px solid rgba(255,255,255,0.12)',
                      boxShadow: isActive ? '0 0 8px rgba(45,127,249,0.3)' : 'none',
                    }}
                  >
                    {isActive && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-zinc-300 group-hover:text-white transition-colors">{make}</span>
                </button>
              );
            })}
            {makes.length > 5 && (
              <button
                onClick={() => setMakesExpanded(!makesExpanded)}
                className="mt-1 ml-2 text-[11px] font-semibold tracking-wide transition-colors"
                style={{ color: '#2D7FF9' }}
              >
                {makesExpanded ? "▲ Show Less" : `+ ${makes.length - 5} More`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(45,127,249,0.12), transparent)' }} />

      {/* ── Price Range (always visible) ── */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-[11px] font-bold text-[#2D7FF9] uppercase tracking-[0.2em]">Price</h3>
          <span className="text-[11px] font-medium text-zinc-500">{priceFormatter.format(priceRange[0])} — {priceFormatter.format(priceRange[1])}</span>
        </div>
        <div className="relative w-full h-7 flex items-center">
          <div className="absolute w-full h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div
            className="absolute h-[3px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #2D7FF9, #5B9FFF)',
              left: `${(priceRange[0] / maxDbPrice) * 100}%`,
              right: `${100 - (priceRange[1] / maxDbPrice) * 100}%`,
              boxShadow: '0 0 8px rgba(45,127,249,0.4)',
            }}
          />
          <input
            type="range" min={minDbPrice} max={maxDbPrice} step={50000}
            value={priceRange[0]}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), priceRange[1] - 50000);
              setPriceRange([val, priceRange[1]]);
            }}
            className="mm-range-slider" style={{ zIndex: 3 }}
          />
          <input
            type="range" min={minDbPrice} max={maxDbPrice} step={50000}
            value={priceRange[1]}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), priceRange[0] + 50000);
              setPriceRange([priceRange[0], val]);
            }}
            className="mm-range-slider" style={{ zIndex: 4 }}
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(45,127,249,0.12), transparent)' }} />

      {/* ── Year (collapsible) ── */}
      <div>
        <button
          onClick={() => setYearOpen(!yearOpen)}
          className="flex items-center justify-between w-full group"
        >
          <h3 className="text-[11px] font-bold text-[#2D7FF9] uppercase tracking-[0.2em]">Year</h3>
          <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${yearOpen ? 'rotate-180' : ''}`} />
        </button>
        {yearOpen && (
          <div className="mt-2 flex items-center gap-2">
            <input type="number" placeholder="Min" value={minYear} onChange={e => setMinYear(e.target.value)} className="mm-glass-input !py-1.5 !text-[12px]" />
            <span className="text-zinc-600 text-[10px]">—</span>
            <input type="number" placeholder="Max" value={maxYear} onChange={e => setMaxYear(e.target.value)} className="mm-glass-input !py-1.5 !text-[12px]" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12 flex flex-col md:flex-row gap-8 relative">

      {/* ═══════════════════════════════════════════
          Mobile filter button (visible < md)
          ═══════════════════════════════════════════ */}
      <div className="md:hidden flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>{t("title")}</h1>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200"
          style={{
            background: 'rgba(20,24,32,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(45,127,249,0.18)',
            color: '#fff',
          }}
        >
          <Filter size={15} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-5 h-5 rounded-full bg-[#2D7FF9] text-[10px] font-bold flex items-center justify-center">
              {categories.length + selectedMakes.length + (minYear || maxYear ? 1 : 0) + (priceRange[0] > minDbPrice || priceRange[1] < maxDbPrice ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          Mobile filter drawer (slide-over)
          ═══════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${showMobileFilters ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowMobileFilters(false)}
      />
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-[320px] max-w-[85vw] overflow-y-auto transition-transform duration-300 ease-out md:hidden ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(10,14,20,0.97)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(45,127,249,0.12)',
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>Filters</h2>
            <div className="flex items-center gap-4">
              <button onClick={clearFilters} className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#2D7FF9] transition-colors">Reset</button>
              <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => setShowMobileFilters(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
          {filterContent}
          <button
            className="w-full mt-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#2D7FF9', borderRadius: '10px', boxShadow: '0 0 20px rgba(45,127,249,0.25)' }}
            onClick={() => setShowMobileFilters(false)}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          Desktop sidebar (visible >= md)
          ═══════════════════════════════════════════ */}
      <aside className="hidden md:block md:w-[260px] shrink-0">
        <div
          className="sticky top-[100px] rounded-2xl p-5"
          style={{
            background: 'rgba(20,24,32,0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(45,127,249,0.18)',
            boxShadow: '0 0 0 1px rgba(45,127,249,0.06), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>Filters</h2>
            <button
              onClick={clearFilters}
              className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#2D7FF9] transition-colors"
            >
              Reset
            </button>
          </div>
          {filterContent}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          Main content area
          ═══════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">
        <h1
          className="hidden md:block text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t("title")}
        </h1>

        {/* ── Search / Sort bar ── */}
        <div
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-2xl p-4"
          style={{
            background: 'rgba(20,24,32,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(45,127,249,0.18)',
            boxShadow: '0 0 0 1px rgba(45,127,249,0.06), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="relative w-full sm:w-96 flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'rgba(45,127,249,0.5)' }} />
            <input
              type="text"
              placeholder="Find vehicle here..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mm-glass-input !pl-10 !w-full !rounded-xl !py-2.5"
            />
          </div>
          <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[12px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Found
            </span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="appearance-none text-[13px] font-medium text-white px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <option value="newest" style={{ background: '#141820' }}>Newest</option>
              <option value="recommended" style={{ background: '#141820' }}>Recommended</option>
              <option value="price-asc" style={{ background: '#141820' }}>Price: Low → High</option>
              <option value="price-desc" style={{ background: '#141820' }}>Price: High → Low</option>
            </select>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            {searchQuery && (
              <span className="mm-filter-chip">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => removeFilter("search")} className="ml-1.5 hover:text-white transition-colors"><X size={11} /></button>
              </span>
            )}
            {categories.map(cat => (
              <span key={cat} className="mm-filter-chip">
                {tLabels(`category.${cat}`)}
                <button onClick={() => removeFilter("category", cat)} className="ml-1.5 hover:text-white transition-colors"><X size={11} /></button>
              </span>
            ))}
            {selectedMakes.map(make => (
              <span key={make} className="mm-filter-chip">
                {make}
                <button onClick={() => removeFilter("make", make)} className="ml-1.5 hover:text-white transition-colors"><X size={11} /></button>
              </span>
            ))}
            {(priceRange[0] > minDbPrice || priceRange[1] < maxDbPrice) && (
              <span className="mm-filter-chip">
                {priceFormatter.format(priceRange[0])} — {priceFormatter.format(priceRange[1])}
                <button onClick={() => removeFilter("price")} className="ml-1.5 hover:text-white transition-colors"><X size={11} /></button>
              </span>
            )}
            {(minYear || maxYear) && (
              <span className="mm-filter-chip">
                {minYear || 'Any'} — {maxYear || 'Any'}
                <button onClick={() => removeFilter("year")} className="ml-1.5 hover:text-white transition-colors"><X size={11} /></button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 hover:text-[#2D7FF9] transition-colors ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* ── Card Grid ── */}
        {filteredVehicles.length === 0 ? (
          <div
            className="rounded-2xl py-24 text-center"
            style={{
              background: 'rgba(20,24,32,0.4)',
              border: '1px dashed rgba(45,127,249,0.15)',
            }}
          >
            <p className="text-zinc-500 text-sm">{t("empty") || "No vehicles found matching your criteria."}</p>
            <button onClick={clearFilters} className="mt-4 text-[#2D7FF9] hover:underline font-semibold text-sm">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle: any, i: number) => {
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

              return (
                <FadeInSection key={vehicle.id} delay={Math.min(i * 0.05, 0.5)} className="h-full">
                  <motion.div 
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(45,127,249,0.3)" }}
                    className="mm-glass-card group relative flex flex-col overflow-hidden h-full"
                  >
                    <Link href={`/vehicles/${vehicle.slug}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {vehicle.make} {vehicle.model}</span>
                  </Link>

                  <button
                    className="absolute top-4 right-4 z-20 p-2 rounded-full transition-all duration-200"
                    style={{
                      background: 'rgba(10,14,20,0.5)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(45,127,249,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <Bookmark size={14} />
                  </button>

                  <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {vehicle.images?.[0] ? (
                      <>
                        <img
                          src={vehicle.images[0].url}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,14,20,0.88) 0%, rgba(10,14,20,0.1) 45%, transparent 100%)' }} />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>No image</div>
                    )}
                    <div
                      className="absolute top-4 left-4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded"
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {statusLabels[vehicle.status] ?? vehicle.status}
                    </div>
                  </div>

                  <div className="flex flex-col p-5 gap-2">
                    <h2 className="text-base font-bold leading-snug text-white group-hover:text-[#2D7FF9] transition-colors duration-300 line-clamp-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>
                    <p className="text-[12px] line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {vehicle.mileageKm.toLocaleString()} km • {transmissionLabels[vehicle.transmission] ?? vehicle.transmission} • {fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}
                    </p>
                    <div className="mt-2 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(45,127,249,0.1)' }}>
                      <p className="text-xl font-black tracking-tight" style={{ color: '#2D7FF9' }}>
                        {priceFormatter.format(vehicle.priceJpy)}
                      </p>
                      <div className="text-[#2D7FF9] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                </FadeInSection>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
