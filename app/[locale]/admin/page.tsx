import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { updateVehicleStatus } from "@/lib/actions/vehicle";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect({ href: "/admin/login", locale: "en" });
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm text-zinc-500 underline">
            Log out
          </button>
        </form>
      </div>

      <Link
        href="/admin/new"
        className="mb-8 inline-block rounded-full bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black"
      >
        Add Vehicle
      </Link>

      <div className="flex flex-col gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex flex-col gap-2 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145] sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-sm text-zinc-500">
                ¥{vehicle.priceJpy.toLocaleString()} · {vehicle.status}
              </p>
            </div>
            <form
              action={updateVehicleStatus.bind(null, vehicle.id)}
              className="flex items-center gap-2"
            >
              <select
                name="status"
                defaultValue={vehicle.status}
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
              <button type="submit" className="rounded border px-3 py-1 text-sm">
                Update
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
