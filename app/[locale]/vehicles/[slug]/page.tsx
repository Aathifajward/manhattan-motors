import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VehicleDetailClient from "./VehicleDetailClient";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale, slug } = await params;
  const { sent } = await searchParams; // Keeping this if needed later

  const vehicle = await prisma.vehicle.findUnique({
    where: { slug },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    notFound();
  }

  const description =
    locale === "ja" && vehicle.descriptionJa
      ? vehicle.descriptionJa
      : vehicle.descriptionEn;
  const showFallbackNote = locale === "ja" && !vehicle.descriptionJa;

  return (
    <VehicleDetailClient
      vehicle={vehicle}
      locale={locale}
      description={description}
      showFallbackNote={showFallbackNote}
    />
  );
}
