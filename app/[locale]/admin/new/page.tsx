import { createVehicle } from "@/lib/actions/vehicle";

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Add Vehicle</h1>
      <form action={createVehicle} className="flex flex-col gap-4">
        <input name="make" placeholder="Make (e.g. Toyota)" required className="rounded border px-3 py-2" />
        <input name="model" placeholder="Model (e.g. Aqua)" required className="rounded border px-3 py-2" />
        <input name="year" type="number" placeholder="Year" required className="rounded border px-3 py-2" />
        <input name="mileageKm" type="number" placeholder="Mileage (km)" required className="rounded border px-3 py-2" />
        <input name="priceJpy" type="number" placeholder="Price (JPY)" required className="rounded border px-3 py-2" />
        <select name="transmission" required className="rounded border px-3 py-2">
          <option value="">Transmission</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
        <select name="fuelType" required className="rounded border px-3 py-2">
          <option value="">Fuel Type</option>
          <option value="petrol">Petrol</option>
          <option value="diesel">Diesel</option>
          <option value="hybrid">Hybrid</option>
          <option value="electric">Electric</option>
        </select>
        <select name="condition" required className="rounded border px-3 py-2">
          <option value="">Condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <textarea name="descriptionEn" placeholder="Description (English)" required className="rounded border px-3 py-2 min-h-[100px]" />
        <textarea name="descriptionJa" placeholder="Description (Japanese, optional)" className="rounded border px-3 py-2 min-h-[100px]" />
        <button type="submit" className="rounded-full bg-black py-2.5 text-white dark:bg-white dark:text-black">
          Save Vehicle
        </button>
      </form>
    </div>
  );
}
