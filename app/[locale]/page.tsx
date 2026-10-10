import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import HeroScroll from "@/components/HeroScroll";
import IdentityPanels from "@/components/IdentityPanels";
import WordReveal from "@/components/WordReveal";
import VehicleSlides from "@/components/VehicleSlides";
import DriveEnd from "@/components/DriveEnd";
import LocationSection from "@/components/scroll/LocationSection";
import SellSection from "@/components/scroll/SellSection";

export const dynamic = "force-dynamic";

/** The only server-side data the homepage still needs — VehicleSlides renders it. */
function fetchFeaturedVehicles() {
  return prisma.vehicle.findMany({
    where: { status: "available" },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { images: { where: { isCover: true }, take: 1 } },
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Database connection failed, retrying... (${retries} left)`);
      await new Promise((r) => setTimeout(r, 1500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

export default async function Home() {
  const t = await getTranslations("HomePage");

  let featuredVehicles: Awaited<ReturnType<typeof fetchFeaturedVehicles>> = [];
  try {
    featuredVehicles = await withRetry(fetchFeaturedVehicles);
  } catch (error) {
    console.error("Failed to fetch featured vehicles:", error);
  }

  return (
    <div className="flex flex-1 flex-col -mt-[88px]">
      {/* 1. Hero — scroll-scrubbed video */}
      <HeroScroll
        title={t("title")}
        subtitle={t("subtitle")}
        browseVehicles={t("browseVehicles")}
        contactUs={t("contactUs")}
      />

      {/* 2. Scroll film */}
      <IdentityPanels />
      <WordReveal />
      <VehicleSlides vehicles={featuredVehicles} />
      <DriveEnd />

      {/* 3. Full-bleed closers */}
      <LocationSection />
      <SellSection />
    </div>
  );
}
