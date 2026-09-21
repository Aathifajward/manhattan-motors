import { signIn } from "@/auth";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-sm px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Admin Login</h1>
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
        <input name="email" type="email" placeholder="Email" required className="rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required className="rounded border px-3 py-2" />
        <button type="submit" className="rounded-full bg-black px-5 py-2.5 text-white dark:bg-white dark:text-black">
          Log In
        </button>
      </form>
    </div>
  );
}
