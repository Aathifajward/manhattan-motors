import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "@/i18n/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect({ href: "/admin/login", locale: "en" });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
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
        className="inline-block rounded-full bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black"
      >
        Add Vehicle
      </Link>
    </div>
  );
}
