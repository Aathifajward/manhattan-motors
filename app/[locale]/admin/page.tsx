import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Admin</h1>
      <Link
        href="/admin/new"
        className="inline-block rounded-full bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black"
      >
        Add Vehicle
      </Link>
    </div>
  );
}
