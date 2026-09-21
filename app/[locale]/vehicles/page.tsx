import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("VehiclesPage");
  const tLabels = await getTranslations("VehicleLabels");

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isCover: true }, take: 1 } },
  });

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">{t("title")}</h1>

      {vehicles.length === 0 ? (
        <p className="text-zinc-500">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
            >
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
                {tLabels(`transmission.${vehicle.transmission}`)} ·{" "}
                {tLabels(`fuelType.${vehicle.fuelType}`)}
              </p>
              <p className="text-base font-medium">
                {priceFormatter.format(vehicle.priceJpy)}
              </p>
              <span className="w-fit rounded-full bg-black/[.06] px-2 py-0.5 text-xs dark:bg-white/[.08]">
                {tLabels(`status.${vehicle.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
