import { prisma } from "@/lib/prisma";
import VehiclesClient from "./VehiclesClient";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  let vehicles: any[] = [];
  let makes: any[] = [];

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
    return (
      <div className="-mt-[88px] w-full pt-[88px]" style={{ background: "#0a0a0a", minHeight: "100vh" }}>
        <div className="mx-auto max-w-5xl px-6 pb-28 pt-20 text-center md:pt-28">
          <p className="font-body text-sm text-white/70">Unable to connect to the database. The server might be waking up.</p>
          <p className="font-body mt-2 text-sm text-white/35">Please refresh the page in a few seconds.</p>
        </div>
      </div>
    );
  }

  const makeList = makes.map(m => m.make);

  return <VehiclesClient initialVehicles={vehicles} makes={makeList} locale={locale} />;
}
