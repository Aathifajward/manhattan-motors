import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { updateVehicle, deleteVehicleImage } from "@/lib/actions/vehicle";
import { notFound } from "next/navigation";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect({ href: "/admin/login", locale: "en" });
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Edit Vehicle</h1>

      {vehicle.images.length > 0 && (
        <div className="mb-8 rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
          <h2 className="mb-4 text-sm font-medium text-zinc-500">Current Photos</h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {vehicle.images.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-lg border border-black/[.08] shadow-sm dark:border-white/[.145]">
                <img src={image.url} alt="" className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <form action={deleteVehicleImage.bind(null, image.id, vehicle.id)}>
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
                    title="Delete photo"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
        <form action={updateVehicle.bind(null, vehicle.id)} className="flex flex-col gap-4">
          <select name="category" defaultValue={vehicle.category} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="CAR" className="dark:bg-zinc-900 dark:text-white">Car</option>
            <option value="TRUCK" className="dark:bg-zinc-900 dark:text-white">Truck</option>
            <option value="VAN" className="dark:bg-zinc-900 dark:text-white">Van</option>
            <option value="MOTORCYCLE" className="dark:bg-zinc-900 dark:text-white">Motorcycle</option>
            <option value="MACHINERY" className="dark:bg-zinc-900 dark:text-white">Machinery</option>
          </select>
          <input name="make" defaultValue={vehicle.make} placeholder="Make" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="model" defaultValue={vehicle.model} placeholder="Model" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="year" type="number" defaultValue={vehicle.year} placeholder="Year" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="mileageKm" type="number" defaultValue={vehicle.mileageKm} placeholder="Mileage (km)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="priceJpy" type="number" defaultValue={vehicle.priceJpy} placeholder="Price (JPY)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          
          <select name="transmission" defaultValue={vehicle.transmission} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="automatic" className="dark:bg-zinc-900 dark:text-white">Automatic</option>
            <option value="manual" className="dark:bg-zinc-900 dark:text-white">Manual</option>
          </select>
          
          <select name="fuelType" defaultValue={vehicle.fuelType} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="petrol" className="dark:bg-zinc-900 dark:text-white">Petrol</option>
            <option value="diesel" className="dark:bg-zinc-900 dark:text-white">Diesel</option>
            <option value="hybrid" className="dark:bg-zinc-900 dark:text-white">Hybrid</option>
            <option value="electric" className="dark:bg-zinc-900 dark:text-white">Electric</option>
          </select>
          
          <select name="condition" defaultValue={vehicle.condition} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="excellent" className="dark:bg-zinc-900 dark:text-white">Excellent</option>
            <option value="good" className="dark:bg-zinc-900 dark:text-white">Good</option>
            <option value="fair" className="dark:bg-zinc-900 dark:text-white">Fair</option>
          </select>
          
          <select name="status" defaultValue={vehicle.status} required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="available" className="dark:bg-zinc-900 dark:text-white">Available</option>
            <option value="reserved" className="dark:bg-zinc-900 dark:text-white">Reserved</option>
            <option value="sold" className="dark:bg-zinc-900 dark:text-white">Sold</option>
          </select>
          
          <textarea name="descriptionEn" defaultValue={vehicle.descriptionEn} placeholder="Description (English)" required rows={4} className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <textarea name="descriptionJa" defaultValue={vehicle.descriptionJa ?? ""} placeholder="Description (Japanese, optional)" rows={4} className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add more photos (optional)</label>
            <input type="file" name="images" accept="image/*" multiple className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark] dark:bg-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-white dark:hover:file:bg-zinc-700" />
          </div>
          
          <button type="submit" className="mt-4 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
