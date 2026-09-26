import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { updateVehicleStatus, deleteVehicle } from "@/lib/actions/vehicle";
import DeleteButton from "@/components/DeleteButton";

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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white">
            Log out
          </button>
        </form>
      </div>

      <Link
        href="/admin/new"
        className="mb-8 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
      >
        Add Vehicle
      </Link>

      <div className="flex flex-col gap-4">
        {vehicles.map((vehicle) => {
          let statusColor = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
          if (vehicle.status === "available") {
            statusColor = "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
          } else if (vehicle.status === "sold") {
            statusColor = "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
          } else if (vehicle.status === "reserved") {
            statusColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
          }

          return (
            <div
              key={vehicle.id}
              className="flex flex-col gap-4 rounded-xl border border-black/[.08] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/[.145] dark:bg-zinc-900/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-bold">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium">¥{vehicle.priceJpy.toLocaleString()}</span>
                  <span className="text-zinc-400">•</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                    {vehicle.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <form action={updateVehicleStatus.bind(null, vehicle.id)} className="flex items-center gap-2">
                  <select name="status" defaultValue={vehicle.status} className="rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]">
                    <option value="available" className="dark:bg-zinc-900 dark:text-white">Available</option>
                    <option value="reserved" className="dark:bg-zinc-900 dark:text-white">Reserved</option>
                    <option value="sold" className="dark:bg-zinc-900 dark:text-white">Sold</option>
                  </select>
                  <button type="submit" className="rounded-lg bg-zinc-100 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                    Update
                  </button>
                </form>
                <Link href={`/admin/vehicles/${vehicle.id}/edit`} className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
                  Edit
                </Link>
                <form action={deleteVehicle.bind(null, vehicle.id)}>
                  <DeleteButton />
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
