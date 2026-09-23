import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createInquiry } from "@/lib/actions/inquiry";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale, slug } = await params;
  const { sent } = await searchParams;

  const vehicle = await prisma.vehicle.findUnique({
    where: { slug },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    notFound();
  }

  const t = await getTranslations("VehicleDetailPage");
  const tLabels = await getTranslations("VehicleLabels");
  const tForm = await getTranslations("InquiryForm");

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

  const priceFormatter = new Intl.NumberFormat(
    locale === "ja" ? "ja-JP" : "en-US",
    { style: "currency", currency: "JPY", maximumFractionDigits: 0 }
  );

  const description =
    locale === "ja" && vehicle.descriptionJa
      ? vehicle.descriptionJa
      : vehicle.descriptionEn;
  const showFallbackNote = locale === "ja" && !vehicle.descriptionJa;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappText = encodeURIComponent(
    `Hi, I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model}`
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {vehicle.images.length > 0 && (
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {vehicle.images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-black/[.08] shadow-sm dark:border-white/[.145]">
              <img
                src={image.url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-2xl font-bold text-black dark:text-white">
            {priceFormatter.format(vehicle.priceJpy)}
          </p>
        </div>
      </div>

      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-bold">{t("specs")}</h2>
            <dl className="grid grid-cols-2 gap-y-4 rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
              <dt className="text-sm font-medium text-zinc-500">{t("mileage")}</dt>
              <dd className="font-semibold text-black dark:text-white">{vehicle.mileageKm.toLocaleString()} km</dd>
              <dt className="text-sm font-medium text-zinc-500">{t("transmission")}</dt>
              <dd className="font-semibold text-black dark:text-white">{transmissionLabels[vehicle.transmission] ?? vehicle.transmission}</dd>
              <dt className="text-sm font-medium text-zinc-500">{t("fuelType")}</dt>
              <dd className="font-semibold text-black dark:text-white">{fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}</dd>
              <dt className="text-sm font-medium text-zinc-500">{t("condition")}</dt>
              <dd className="font-semibold text-black dark:text-white">{conditionLabels[vehicle.condition] ?? vehicle.condition}</dd>
            </dl>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold">{t("description")}</h2>
            {showFallbackNote && (
              <p className="mb-2 text-xs italic text-zinc-500">
                {t("descriptionFallbackNote")}
              </p>
            )}
            <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
              <p className="whitespace-pre-line text-zinc-700 leading-relaxed dark:text-zinc-300">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
            <h2 className="mb-6 text-xl font-bold">{t("contactUs")}</h2>

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 font-medium text-white transition-colors hover:bg-[#20bd5a]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                {t("whatsapp")}
              </a>
            )}

            {sent === "true" && (
              <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-200">
                {tForm("success")}
              </p>
            )}

            <form action={createInquiry} className="flex flex-col gap-4">
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="slug" value={vehicle.slug} />
              <input name="name" placeholder={tForm("name")} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
              <input name="email" type="email" placeholder={tForm("email")} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
              <input name="phone" placeholder={tForm("phone")} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
              <select name="preferredContact" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone</option>
              </select>
              <textarea name="message" placeholder={tForm("message")} required rows={4} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
              <button type="submit" className="mt-2 w-full rounded-lg bg-black px-5 py-3 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
                {tForm("submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
