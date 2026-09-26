import { signIn } from "@/auth";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">Admin Login</h1>
      
      <div className="rounded-xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900/50">
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: `/${locale}/admin`,
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input name="email" type="email" placeholder="admin@example.com" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input name="password" type="password" placeholder="••••••••" required className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2.5 text-sm dark:border-zinc-700 dark:[color-scheme:dark]" />
          </div>
          
          <button type="submit" className="mt-4 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
