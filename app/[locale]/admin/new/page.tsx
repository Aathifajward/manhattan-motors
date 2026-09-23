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
          <select name="category" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
            <option value="">Category</option>
            <option value="CAR">Car</option>
            <option value="TRUCK">Truck</option>
            <option value="VAN">Van</option>
            <option value="MOTORCYCLE">Motorcycle</option>
            <option value="MACHINERY">Machinery</option>
          </select>
          <input name="make" placeholder="Make (e.g. Toyota)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          <input name="model" placeholder="Model (e.g. Aqua)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          <input name="year" type="number" placeholder="Year" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          <input name="mileageKm" type="number" placeholder="Mileage (km)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          <input name="priceJpy" type="number" placeholder="Price (JPY)" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          
          <select name="transmission" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
            <option value="">Transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
          
          <select name="fuelType" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
            <option value="">Fuel Type</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Electric</option>
          </select>
          
          <select name="condition" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700">
            <option value="">Condition</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
          
          <textarea name="descriptionEn" placeholder="Description (English)" required className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          <textarea name="descriptionJa" placeholder="Description (Japanese, optional)" className="min-h-[120px] rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700" />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload Photos</label>
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700"
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
