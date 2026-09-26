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
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-xl border border-dashed border-red-300 bg-red-50 py-16 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <p className="font-medium text-red-600 dark:text-red-400">Unable to connect to the database. The server might be waking up.</p>
          <p className="mt-2 text-sm text-red-500/80 dark:text-red-400/80">Please refresh the page in a few seconds.</p>
        </div>
      </div>
    );
  }

  const makeList = makes.map(m => m.make);

  return <VehiclesClient initialVehicles={vehicles} makes={makeList} locale={locale} />;
}
