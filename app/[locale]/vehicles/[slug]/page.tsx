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
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {vehicle.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-40 w-full rounded object-cover"
            />
          ))}
        </div>
      )}

      <h1 className="mb-2 text-3xl font-semibold">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>
      <p className="mb-6 text-2xl font-medium">
        {priceFormatter.format(vehicle.priceJpy)}
      </p>

      <h2 className="mb-2 text-lg font-semibold">{t("specs")}</h2>
      <dl className="mb-8 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-zinc-500">{t("mileage")}</dt>
        <dd>{vehicle.mileageKm.toLocaleString()} km</dd>
        <dt className="text-zinc-500">{t("transmission")}</dt>
        <dd>{transmissionLabels[vehicle.transmission] ?? vehicle.transmission}</dd>
        <dt className="text-zinc-500">{t("fuelType")}</dt>
        <dd>{fuelTypeLabels[vehicle.fuelType] ?? vehicle.fuelType}</dd>
        <dt className="text-zinc-500">{t("condition")}</dt>
        <dd>{conditionLabels[vehicle.condition] ?? vehicle.condition}</dd>
      </dl>

      <h2 className="mb-2 text-lg font-semibold">{t("description")}</h2>
      {showFallbackNote && (
        <p className="mb-2 text-xs italic text-zinc-500">
          {t("descriptionFallbackNote")}
        </p>
      )}
      <p className="mb-8 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
        {description}
      </p>

      <h2 className="mb-4 text-lg font-semibold">{t("contactUs")}</h2>

      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-block rounded-full bg-green-600 px-5 py-2.5 text-white"
        >
          {t("whatsapp")}
        </a>
      )}

      {sent === "true" && (
        <p className="mb-4 rounded bg-green-50 px-4 py-3 text-green-800 dark:bg-green-950 dark:text-green-200">
          {tForm("success")}
        </p>
      )}

      <form action={createInquiry} className="flex flex-col gap-4">
        <input type="hidden" name="vehicleId" value={vehicle.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="slug" value={vehicle.slug} />
        <input name="name" placeholder={tForm("name")} required className="rounded border px-3 py-2" />
        <input name="email" type="email" placeholder={tForm("email")} required className="rounded border px-3 py-2" />
        <input name="phone" placeholder={tForm("phone")} className="rounded border px-3 py-2" />
        <select name="preferredContact" required className="rounded border px-3 py-2">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="phone">Phone</option>
        </select>
        <textarea name="message" placeholder={tForm("message")} required rows={4} className="rounded border px-3 py-2" />
        <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black">
          {tForm("submit")}
        </button>
      </form>
    </div>
  );
}
