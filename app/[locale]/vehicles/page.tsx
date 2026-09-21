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
    make?: string;
    minYear?: string;
    maxYear?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { locale } = await params;
  const { make, minYear, maxYear, minPrice, maxPrice } = await searchParams;

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

  const [vehicles, makes] = await Promise.all([
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
  ]);

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">{t("title")}</h1>

      <form method="get" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <select name="make" defaultValue={make ?? ""} className="rounded border px-2 py-2 text-sm">
          <option value="">{t("filterAllMakes")}</option>
          {makes.map((m) => (
            <option key={m.make} value={m.make}>
              {m.make}
            </option>
          ))}
        </select>
        <input type="number" name="minYear" placeholder={t("filterMinYear")} defaultValue={minYear ?? ""} className="rounded border px-2 py-2 text-sm" />
        <input type="number" name="maxYear" placeholder={t("filterMaxYear")} defaultValue={maxYear ?? ""} className="rounded border px-2 py-2 text-sm" />
        <input type="number" name="minPrice" placeholder={t("filterMinPrice")} defaultValue={minPrice ?? ""} className="rounded border px-2 py-2 text-sm" />
        <input type="number" name="maxPrice" placeholder={t("filterMaxPrice")} defaultValue={maxPrice ?? ""} className="rounded border px-2 py-2 text-sm" />
        <button type="submit" className="col-span-2 rounded border px-3 py-2 text-sm sm:col-span-5">
          {t("filterApply")}
        </button>
      </form>

      {vehicles.length === 0 ? (
        <p className="text-zinc-500">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link href={`/vehicles/${vehicle.slug}`} key={vehicle.id} className="block">
              <div className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
                {vehicle.images[0] && (
                  <img
                    src={vehicle.images[0].url}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="h-40 w-full rounded object-cover"
                  />
                )}
                <h2 className="text-lg font-semibold">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-sm text-zinc-500">
                  {vehicle.mileageKm.toLocaleString()} km ·{" "}
                  {transmissionLabels[vehicle.transmission] ?? vehicle.transmission} ·{" "}
                  {fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}
                </p>
                <p className="text-base font-medium">
                  {priceFormatter.format(vehicle.priceJpy)}
                </p>
                <span className="w-fit rounded-full bg-black/[.06] px-2 py-0.5 text-xs dark:bg-white/[.08]">
                  {statusLabels[vehicle.status] ?? vehicle.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
