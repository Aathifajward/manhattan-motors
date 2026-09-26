import { createVehicle } from "@/lib/actions/vehicle";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";

export default async function NewVehiclePage() {
  const session = await auth();
  if (!session) {
    redirect({ href: "/admin/login", locale: "en" });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Add Vehicle</h1>
      
      <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
        <form action={createVehicle} className="flex flex-col gap-4">
          <select name="category" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="" className="dark:bg-zinc-900 dark:text-white">Category</option>
            <option value="CAR" className="dark:bg-zinc-900 dark:text-white">Car</option>
            <option value="TRUCK" className="dark:bg-zinc-900 dark:text-white">Truck</option>
            <option value="VAN" className="dark:bg-zinc-900 dark:text-white">Van</option>
            <option value="MOTORCYCLE" className="dark:bg-zinc-900 dark:text-white">Motorcycle</option>
            <option value="MACHINERY" className="dark:bg-zinc-900 dark:text-white">Machinery</option>
          </select>
          <input name="make" placeholder="Make (e.g. Toyota)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="model" placeholder="Model (e.g. Aqua)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="year" type="number" placeholder="Year" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="mileageKm" type="number" placeholder="Mileage (km)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <input name="priceJpy" type="number" placeholder="Price (JPY)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          
          <select name="transmission" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="" className="dark:bg-zinc-900 dark:text-white">Transmission</option>
            <option value="automatic" className="dark:bg-zinc-900 dark:text-white">Automatic</option>
            <option value="manual" className="dark:bg-zinc-900 dark:text-white">Manual</option>
          </select>
          
          <select name="fuelType" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="" className="dark:bg-zinc-900 dark:text-white">Fuel Type</option>
            <option value="petrol" className="dark:bg-zinc-900 dark:text-white">Petrol</option>
            <option value="diesel" className="dark:bg-zinc-900 dark:text-white">Diesel</option>
            <option value="hybrid" className="dark:bg-zinc-900 dark:text-white">Hybrid</option>
            <option value="electric" className="dark:bg-zinc-900 dark:text-white">Electric</option>
          </select>
          
          <select name="condition" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
            <option value="" className="dark:bg-zinc-900 dark:text-white">Condition</option>
            <option value="excellent" className="dark:bg-zinc-900 dark:text-white">Excellent</option>
            <option value="good" className="dark:bg-zinc-900 dark:text-white">Good</option>
            <option value="fair" className="dark:bg-zinc-900 dark:text-white">Fair</option>
          </select>
          
          <textarea name="descriptionEn" placeholder="Description (English)" required className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          <textarea name="descriptionJa" placeholder="Description (Japanese, optional)" className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload Photos</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark] dark:bg-zinc-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-white dark:hover:file:bg-zinc-700"
            />
          </div>
          
          <button type="submit" className="mt-4 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
            Save Vehicle
          </button>
        </form>
      </div>
    </div>
  );
}
