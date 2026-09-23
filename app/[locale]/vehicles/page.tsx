import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string | string[];
    make?: string;
    minYear?: string;
    maxYear?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { locale } = await params;
  const { category, make, minYear, maxYear, minPrice, maxPrice } = await searchParams;

  const t = await getTranslations("VehiclesPage");
  const tLabels = await getTranslations("VehicleLabels");

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

  const where: Record<string, unknown> = {};
  if (category) {
    const cats = Array.isArray(category) ? category : [category];
    where.category = { in: cats.map(c => c.toUpperCase()) };
  }
  if (make) where.make = make;
  if (minYear || maxYear) {
    where.year = {
      ...(minYear ? { gte: Number(minYear) } : {}),
      ...(maxYear ? { lte: Number(maxYear) } : {}),
    };
  }
  if (minPrice || maxPrice) {
    where.priceJpy = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
  }

  let vehicles: any[] = [];
  let makes: any[] = [];
  let dbError = false;

  try {
    const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (retries > 0) {
          console.warn(`Database connection failed, retrying in 1.5s... (${retries} retries left)`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return fetchWithRetry(fn, retries - 1);
        }
        throw err;
      }
    };

    [vehicles, makes] = await fetchWithRetry(() =>
      Promise.all([
        prisma.vehicle.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { images: { where: { isCover: true }, take: 1 } },
        }),
        prisma.vehicle.findMany({
          distinct: ["make"],
          select: { make: true },
          orderBy: { make: "asc" },
        }),
      ])
    );
  } catch (error) {
    console.error("Failed to fetch vehicles from database:", error);
    dbError = true;
  }

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <div className="mb-10 rounded-xl border border-black/[.08] bg-white p-5 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
        <form method="get" className="grid grid-cols-2 gap-4 md:grid-cols-6 md:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterAllCategories")}</label>
            <select name="category" defaultValue={category ? (Array.isArray(category) ? category[0] : category) : ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
              <option value="">{t("filterAllCategories")}</option>
              {["CAR", "TRUCK", "VAN", "MOTORCYCLE", "MACHINERY"].map((cat) => (
                <option key={cat} value={cat}>
                  {tLabels(`category.${cat}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterAllMakes")}</label>
            <select name="make" defaultValue={make ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
              <option value="">{t("filterAllMakes")}</option>
              {makes.map((m) => (
                <option key={m.make} value={m.make}>
                  {m.make}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterMinYear")}</label>
            <input type="number" name="minYear" placeholder="e.g. 2010" defaultValue={minYear ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterMaxYear")}</label>
            <input type="number" name="maxYear" placeholder="e.g. 2024" defaultValue={maxYear ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterMinPrice")}</label>
            <input type="number" name="minPrice" placeholder="¥" defaultValue={minPrice ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">{t("filterMaxPrice")}</label>
            <input type="number" name="maxPrice" placeholder="¥" defaultValue={maxPrice ?? ""} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          </div>
          <button type="submit" className="col-span-2 mt-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 md:col-span-6 md:mt-0 md:w-fit md:place-self-end">
            {t("filterApply")}
          </button>
        </form>
      </div>

      {dbError ? (
        <div className="rounded-xl border border-dashed border-red-300 bg-red-50 py-16 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <p className="font-medium text-red-600 dark:text-red-400">Unable to connect to the database. The server might be waking up.</p>
          <p className="mt-2 text-sm text-red-500/80 dark:text-red-400/80">Please refresh the page in a few seconds.</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-zinc-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            let statusColor = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
            if (vehicle.status === "available") {
              statusColor = "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
            } else if (vehicle.status === "sold") {
              statusColor = "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
            } else if (vehicle.status === "reserved") {
              statusColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
            }

            return (
              <Link href={`/vehicles/${vehicle.slug}`} key={vehicle.id} className="group block h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/[.08] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/[.145] dark:bg-zinc-900/20">
                  {vehicle.images[0] ? (
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      <span className="text-zinc-400">No image</span>
                    </div>
                  )}
                  
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold leading-tight text-black dark:text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase ${statusColor}`}>
                        {statusLabels[vehicle.status] ?? vehicle.status}
                      </span>
                    </div>
                    
                    <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {vehicle.mileageKm.toLocaleString()} km • {transmissionLabels[vehicle.transmission] ?? vehicle.transmission} • {fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}
                    </p>
                    
                    <div className="mt-auto">
                      <p className="text-xl font-bold text-black dark:text-white">
                        {priceFormatter.format(vehicle.priceJpy)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
